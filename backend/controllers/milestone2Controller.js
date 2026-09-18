const db = require("../db");

const simpleError = (res, error, message) => {
  console.error(message, error);
  return res.status(500).json({ message, error: error.message });
};

const list = (table) => async (req, res) => {
  try { const result = await db.query(`SELECT * FROM ${table} ORDER BY id DESC`); res.json(result.rows); }
  catch (e) { simpleError(res, e, `Error fetching ${table}`); }
};

const createMaterialRequest = async (req, res) => {
  try {
    const { project_id, inventory_id, quantity, unit, request_date = null, status = "REQUESTED" } = req.body;
    const result = await db.query(`INSERT INTO material_requests (project_id,requested_by,inventory_id,quantity,unit,request_date,status) VALUES ($1,$2,$3,$4,$5,COALESCE($6,CURRENT_DATE),$7) RETURNING *`, [project_id, req.user.id, inventory_id, quantity, unit || null, request_date, status]);
    res.status(201).json({ message: "Material request created", request: result.rows[0] });
  } catch (e) { simpleError(res, e, "Error creating material request"); }
};

const updateMaterialRequest = async (req, res) => {
  try {
    const fields = ["quantity","unit","request_date","status","approved_by","approved_at"].filter((f) => Object.prototype.hasOwnProperty.call(req.body, f));
    if (!fields.length) return res.status(400).json({ message: "No request fields supplied" });
    if (Object.prototype.hasOwnProperty.call(req.body, "status") && ["REQUESTED","APPROVED","REJECTED","FULFILLED"].indexOf(req.body.status) === -1) return res.status(400).json({ message: "Invalid request status" });
    const values = fields.map((f) => req.body[f]);
    const result = await db.query(`UPDATE material_requests SET ${fields.map((f,i)=>`${f}=$${i+1}`).join(", ")} WHERE id=$${values.length+1} RETURNING *`, [...values, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: "Material request not found" });
    res.json({ message: "Material request updated", request: result.rows[0] });
  } catch (e) { simpleError(res, e, "Error updating material request"); }
};

const deleteMaterialRequest = async (req, res) => {
  try { const result = await db.query("DELETE FROM material_requests WHERE id=$1 RETURNING *", [req.params.id]); if (!result.rows.length) return res.status(404).json({ message: "Material request not found" }); res.json({ message: "Material request deleted", request: result.rows[0] }); }
  catch (e) { simpleError(res, e, "Error deleting material request"); }
};

const createMaterialAllocation = async (req, res) => {
  const client = await db.connect();
  const run = async (dbLike) => {
    const { project_id, inventory_id, quantity, allocation_date = null } = req.body;
    const stock = await dbLike.query("SELECT quantity FROM inventory WHERE id=$1 FOR UPDATE", [inventory_id]);
    if (!stock.rows.length) return { status: 404, body: { message: "Inventory item not found" } };
    if (Number(stock.rows[0].quantity) < Number(quantity)) return { status: 400, body: { message: "Insufficient stock" } };
    const created = await dbLike.query(`INSERT INTO material_allocations (project_id,inventory_id,quantity,allocated_by,allocation_date) VALUES ($1,$2,$3,$4,COALESCE($5,CURRENT_DATE)) RETURNING *`, [project_id, inventory_id, quantity, req.user.id, allocation_date]);
    await dbLike.query("UPDATE inventory SET quantity=quantity-$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2", [quantity, inventory_id]);
    return { status: 201, body: { message: "Material allocated", allocation: created.rows[0] } };
  };
  try {
    if (client) { await client.query("BEGIN"); const result = await run(client); if (result.status >= 400) { await client.query("ROLLBACK"); return res.status(result.status).json(result.body); } await client.query("COMMIT"); return res.status(result.status).json(result.body); }
    const result = await run(db); return res.status(result.status).json(result.body);
  } catch (e) { if (client) await client.query("ROLLBACK").catch(()=>{}); return simpleError(res, e, "Error allocating material"); } finally { client?.release?.(); }
};

const deleteMaterialAllocation = async (req, res) => {
  try {
    const allocation = await db.query("SELECT * FROM material_allocations WHERE id=$1", [req.params.id]);
    if (!allocation.rows.length) return res.status(404).json({ message: "Allocation not found" });
    await db.query("UPDATE inventory SET quantity=quantity+$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2", [allocation.rows[0].quantity, allocation.rows[0].inventory_id]);
    const result = await db.query("DELETE FROM material_allocations WHERE id=$1 RETURNING *", [req.params.id]);
    res.json({ message: "Allocation deleted and stock restored", allocation: result.rows[0] });
  } catch (e) { simpleError(res, e, "Error deleting material allocation"); }
};

const createWorkforceAllocation = async (req, res) => {
  try {
    const { worker_id, project_id, role, start_date, end_date = null, status = "ACTIVE" } = req.body;
    const worker = await db.query("SELECT id FROM users WHERE id=$1 AND role='Worker'", [worker_id]);
    if (!worker.rows.length) return res.status(400).json({ message: "Worker not found" });
    const result = await db.query(`INSERT INTO workforce_allocations (worker_id,project_id,role,start_date,end_date,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [worker_id, project_id, role, start_date, end_date, status]);
    res.status(201).json({ message: "Worker allocated", allocation: result.rows[0] });
  } catch (e) { simpleError(res, e, "Error creating workforce allocation"); }
};

const updateWorkforceAllocation = async (req, res) => {
  try {
    const fields = ["project_id","role","start_date","end_date","status"].filter((f) => Object.prototype.hasOwnProperty.call(req.body, f));
    if (!fields.length) return res.status(400).json({ message: "No allocation fields supplied" });
    const values = fields.map((f) => req.body[f]);
    const result = await db.query(`UPDATE workforce_allocations SET ${fields.map((f,i)=>`${f}=$${i+1}`).join(", ")} WHERE id=$${values.length+1} RETURNING *`, [...values, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: "Allocation not found" });
    res.json({ message: "Workforce allocation updated", allocation: result.rows[0] });
  } catch (e) { simpleError(res, e, "Error updating workforce allocation"); }
};

const deleteWorkforceAllocation = async (req, res) => {
  try { const result = await db.query("DELETE FROM workforce_allocations WHERE id=$1 RETURNING *", [req.params.id]); if (!result.rows.length) return res.status(404).json({ message: "Allocation not found" }); res.json({ message: "Workforce allocation deleted", allocation: result.rows[0] }); }
  catch (e) { simpleError(res, e, "Error deleting workforce allocation"); }
};

const createShift = async (req, res) => {
  try { const { project_id, shift_name, shift_date, start_time, end_time, status = "SCHEDULED" } = req.body; const result = await db.query(`INSERT INTO shifts (project_id,shift_name,shift_date,start_time,end_time,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [project_id,shift_name,shift_date,start_time,end_time,status]); res.status(201).json({ message: "Shift scheduled", shift: result.rows[0] }); }
  catch (e) { simpleError(res, e, "Error creating shift"); }
};
const updateShift = async (req, res) => {
  try { const fields=["project_id","shift_name","shift_date","start_time","end_time","status"].filter((f)=>Object.prototype.hasOwnProperty.call(req.body,f)); if(!fields.length)return res.status(400).json({message:"No shift fields supplied"}); const values=fields.map(f=>req.body[f]); const result=await db.query(`UPDATE shifts SET ${fields.map((f,i)=>`${f}=$${i+1}`).join(", ")} WHERE id=$${values.length+1} RETURNING *`,[...values,req.params.id]); if(!result.rows.length)return res.status(404).json({message:"Shift not found"}); res.json({message:"Shift updated",shift:result.rows[0]}); }
  catch(e){simpleError(res,e,"Error updating shift");}
};
const deleteShift = async (req,res)=>{try{const result=await db.query("DELETE FROM shifts WHERE id=$1 RETURNING *",[req.params.id]);if(!result.rows.length)return res.status(404).json({message:"Shift not found"});res.json({message:"Shift deleted",shift:result.rows[0]});}catch(e){simpleError(res,e,"Error deleting shift");}};

const createPayroll = async (req,res)=>{try{const {worker_id,project_id=null,pay_period_start,pay_period_end,days_worked=0,daily_wage=0,overtime=0,deductions=0,payment_status="PENDING",net_pay}=req.body;const calculated=net_pay===undefined?Number(days_worked)*Number(daily_wage)+Number(overtime)-Number(deductions):Number(net_pay);const result=await db.query(`INSERT INTO payroll (worker_id,project_id,pay_period_start,pay_period_end,days_worked,daily_wage,overtime,deductions,net_pay,payment_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,[worker_id,project_id,pay_period_start,pay_period_end,days_worked,daily_wage,overtime,deductions,calculated,payment_status]);res.status(201).json({message:"Payroll created",payroll:result.rows[0]});}catch(e){simpleError(res,e,"Error creating payroll");}};
const updatePayroll=async(req,res)=>{try{const fields=["project_id","pay_period_start","pay_period_end","days_worked","daily_wage","overtime","deductions","net_pay","payment_status"].filter((f)=>Object.prototype.hasOwnProperty.call(req.body,f));if(!fields.length)return res.status(400).json({message:"No payroll fields supplied"});const values=fields.map(f=>req.body[f]);const result=await db.query(`UPDATE payroll SET ${fields.map((f,i)=>`${f}=$${i+1}`).join(", ")} WHERE id=$${values.length+1} RETURNING *`,[...values,req.params.id]);if(!result.rows.length)return res.status(404).json({message:"Payroll record not found"});res.json({message:"Payroll updated",payroll:result.rows[0]});}catch(e){simpleError(res,e,"Error updating payroll");}};
const deletePayroll=async(req,res)=>{try{const result=await db.query("DELETE FROM payroll WHERE id=$1 RETURNING *",[req.params.id]);if(!result.rows.length)return res.status(404).json({message:"Payroll record not found"});res.json({message:"Payroll deleted",payroll:result.rows[0]});}catch(e){simpleError(res,e,"Error deleting payroll");}};

module.exports = { list, createMaterialRequest, updateMaterialRequest, deleteMaterialRequest, createMaterialAllocation, deleteMaterialAllocation, createWorkforceAllocation, updateWorkforceAllocation, deleteWorkforceAllocation, createShift, updateShift, deleteShift, createPayroll, updatePayroll, deletePayroll };
