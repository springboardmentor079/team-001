import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Calendar,
  CheckCircle2,
  Edit3,
  FolderKanban,
  Layers,
  Plus,
  RefreshCw,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  Truck,
  UserCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { Button } from '../components/Button';
import { api } from '../services/api';

const PROJECT_CATEGORIES = ['Residential', 'Commercial', 'Industrial', 'Infrastructure', 'Government Projects'];
const RESOURCE_CATEGORIES = ['EXCAVATORS', 'CONCRETE_MIXERS', 'CRANES', 'DUMP_TRUCKS', 'GENERATORS', 'SAFETY_EQUIPMENT'];
const RESOURCE_STATUSES = ['AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE'];
const MATERIAL_CATEGORIES = ['CEMENT', 'STEEL', 'BRICKS', 'SAND', 'CONCRETE', 'ELECTRICAL_MATERIALS', 'PLUMBING_MATERIALS'];
const WORKFORCE_ROLES = ['Engineer', 'Supervisor', 'Contractor', 'Skilled Worker', 'Unskilled Worker', 'Consultant'];

const emptyProject = {
  name: '', description: '', category: 'Residential', location: '', start_date: '', end_date: '', budget: '', status: 'planning'
};
const emptyResource = {
  name: '', category: 'EXCAVATORS', quantity: 1, project_id: '', status: 'AVAILABLE', utilization_percentage: 0, maintenance_date: ''
};
const emptyInventory = {
  project_id: '', material_name: '', category: 'CEMENT', quantity: 0, minimum_stock: 0, unit: 'unit', unit_price: 0, supplier: ''
};
const emptyWorker = {
  name: '', email: '', password_hash: '', phone: '', is_active: true
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-black text-white">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="space-y-1 block">
    <span className="text-[11px] font-semibold text-slate-400">{label}</span>
    {children}
  </label>
);

const inputClass = 'w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500';

const TabButton = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
      active
        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);

export const Dashboard = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [resources, setResources] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [materialAllocations, setMaterialAllocations] = useState([]);
  const [workforceAllocations, setWorkforceAllocations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [profileData, setProfileData] = useState(null);

  const [projectModal, setProjectModal] = useState(null);
  const [resourceModal, setResourceModal] = useState(null);
  const [inventoryModal, setInventoryModal] = useState(null);
  const [workerModal, setWorkerModal] = useState(null);
  const [attendanceModal, setAttendanceModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [allocationModal, setAllocationModal] = useState(false);
  const [workforceAllocationModal, setWorkforceAllocationModal] = useState(false);
  const [shiftModal, setShiftModal] = useState(false);
  const [payrollModal, setPayrollModal] = useState(false);
  const [procurementModal, setProcurementModal] = useState(false);
  const [editProfile, setEditProfile] = useState(false);

  const [projectForm, setProjectForm] = useState(emptyProject);
  const [resourceForm, setResourceForm] = useState(emptyResource);
  const [inventoryForm, setInventoryForm] = useState(emptyInventory);
  const [workerForm, setWorkerForm] = useState(emptyWorker);
  const [attendanceForm, setAttendanceForm] = useState({ worker_id: '', attendance_date: new Date().toISOString().slice(0, 10), status: 'Present', check_in: '', check_out: '' });
  const [requestForm, setRequestForm] = useState({ project_id: '', inventory_id: '', quantity: '', unit: '', request_date: new Date().toISOString().slice(0, 10), status: 'REQUESTED' });
  const [allocationForm, setAllocationForm] = useState({ project_id: '', inventory_id: '', quantity: '', allocation_date: new Date().toISOString().slice(0, 10) });
  const [workforceAllocationForm, setWorkforceAllocationForm] = useState({ worker_id: '', project_id: '', role: 'Engineer', start_date: '', end_date: '', status: 'ACTIVE' });
  const [shiftForm, setShiftForm] = useState({ project_id: '', shift_name: '', shift_date: '', start_time: '', end_time: '', status: 'SCHEDULED' });
  const [payrollForm, setPayrollForm] = useState({ worker_id: '', project_id: '', pay_period_start: '', pay_period_end: '', days_worked: '', daily_wage: '', overtime: 0, deductions: 0, payment_status: 'PENDING' });
  const [procurementForm, setProcurementForm] = useState({ project_id: '', item_name: '', category: 'RAW_MATERIALS', quantity: '', unit_price: '', supplier: '', status: 'REQUESTED', order_date: '', delivery_date: '' });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    const nextErrors = {};
    const safe = async (key, fn, setter, transform = (v) => v) => {
      try {
        const data = await fn();
        setter(transform(data));
      } catch (error) {
        nextErrors[key] = error.message;
      }
    };

    await Promise.all([
      safe('projects', api.getProjects, setProjects, (v) => Array.isArray(v) ? v : []),
      safe('milestones', api.getProgress, setMilestones, (v) => Array.isArray(v) ? v : []),
      safe('resources', api.getResources, setResources, (v) => Array.isArray(v?.resources) ? v.resources : Array.isArray(v) ? v : []),
      safe('inventory', api.getInventory, setInventory, (v) => Array.isArray(v?.inventory) ? v.inventory : Array.isArray(v) ? v : []),
      safe('procurements', api.getProcurements, setProcurements, (v) => Array.isArray(v?.procurements) ? v.procurements : Array.isArray(v) ? v : []),
      safe('workers', api.getWorkers, setWorkers, (v) => Array.isArray(v) ? v : []),
      safe('attendance', api.getAttendance, setAttendance, (v) => Array.isArray(v) ? v : []),
      safe('materialRequests', api.getMaterialRequests, setMaterialRequests, (v) => Array.isArray(v) ? v : []),
      safe('materialAllocations', api.getMaterialAllocations, setMaterialAllocations, (v) => Array.isArray(v) ? v : []),
      safe('workforceAllocations', api.getWorkforceAllocations, setWorkforceAllocations, (v) => Array.isArray(v) ? v : []),
      safe('shifts', api.getShifts, setShifts, (v) => Array.isArray(v) ? v : []),
      safe('payroll', api.getPayroll, setPayroll, (v) => Array.isArray(v) ? v : []),
      safe('notifications', api.getNotifications, setNotifications, (v) => Array.isArray(v) ? v : []),
      safe('profile', api.getProfile, setProfileData, (v) => v?.user || v),
    ]);

    setErrors(nextErrors);
    setLoading(false);
  };

  useEffect(() => { loadDashboardData(); }, []);

  const overallProgress = useMemo(() => {
    if (!milestones.length) return 0;
    return Math.round(milestones.reduce((sum, item) => sum + Number(item.completion_pct || 0), 0) / milestones.length);
  }, [milestones]);

  const totalBudget = useMemo(() => projects.reduce((sum, p) => sum + Number(p.budget || 0), 0), [projects]);
  const lowStockCount = inventory.filter((item) => Number(item.quantity ?? 0) <= Number(item.minimum_stock ?? 0)).length;

  const saveProject = async (event) => {
    event.preventDefault();
    try {
      if (projectModal?.mode === 'edit') await api.updateProject(projectModal.item.id, projectForm);
      else await api.createProject(projectForm);
      setProjectModal(null);
      setProjectForm(emptyProject);
      showNotice(projectModal?.mode === 'edit' ? 'Project updated.' : 'Project created.');
      await loadDashboardData();
    } catch (error) { showNotice(error.message); }
  };

  const closeProject = async (id) => {
    try { await api.closeProject(id); showNotice('Project closed.'); await loadDashboardData(); }
    catch (error) { showNotice(error.message); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try { await api.deleteProject(id); showNotice('Project deleted.'); await loadDashboardData(); }
    catch (error) { showNotice(error.message); }
  };

  const saveResource = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...resourceForm, quantity: Number(resourceForm.quantity), utilization_percentage: Number(resourceForm.utilization_percentage), project_id: resourceForm.project_id ? Number(resourceForm.project_id) : null, maintenance_date: resourceForm.maintenance_date || null, status: resourceForm.status };
      if (resourceModal?.mode === 'edit') await api.updateResource(resourceModal.item.id, payload);
      else await api.createResource(payload);
      setResourceModal(null); setResourceForm(emptyResource); showNotice('Resource saved.'); await loadDashboardData();
    } catch (error) { showNotice(error.message); }
  };

  const saveInventory = async (event) => {
    event.preventDefault();
    try {
      const payload = { ...inventoryForm, project_id: inventoryForm.project_id ? Number(inventoryForm.project_id) : null, quantity: Number(inventoryForm.quantity), minimum_stock: Number(inventoryForm.minimum_stock), unit_price: Number(inventoryForm.unit_price) };
      if (inventoryModal?.mode === 'edit') await api.updateInventory(inventoryModal.item.id, payload);
      else await api.createInventory(payload);
      setInventoryModal(null); setInventoryForm(emptyInventory); showNotice('Inventory item saved.'); await loadDashboardData();
    } catch (error) { showNotice(error.message); }
  };

  const saveWorker = async (event) => {
    event.preventDefault();
    try {
      const payload = { name: workerForm.name, email: workerForm.email, password_hash: workerForm.password_hash || undefined, phone: workerForm.phone, is_active: workerForm.is_active };
      if (workerModal?.mode === 'edit') await api.updateWorker(workerModal.item.id, payload);
      else await api.createWorker(payload);
      setWorkerModal(null); setWorkerForm(emptyWorker); showNotice('Worker saved.'); await loadDashboardData();
    } catch (error) { showNotice(error.message); }
  };

  const saveAttendance = async (event) => {
    event.preventDefault();
    try { await api.createAttendance({ ...attendanceForm, worker_id: Number(attendanceForm.worker_id) }); setAttendanceModal(false); showNotice('Attendance recorded.'); await loadDashboardData(); }
    catch (error) { showNotice(error.message); }
  };

  const updateProgress = async (milestone, value) => {
    const pct = Number(value);
    const status = pct === 100 ? 'Completed' : pct === 0 ? 'Pending' : 'In Progress';
    try {
      await api.updateProgress(milestone.id, { project_id: milestone.project_id, name: milestone.name || milestone.title, description: milestone.description || '', due_date: milestone.due_date || null, completed_date: pct === 100 ? new Date().toISOString().slice(0, 10) : null, status, completion_pct: pct });
      showNotice('Milestone progress updated.'); await loadDashboardData();
    } catch (error) { showNotice(error.message); }
  };

  const saveProcurement = async (event) => {
    event.preventDefault();
    try { await api.createProcurement({ ...procurementForm, project_id: Number(procurementForm.project_id), quantity: Number(procurementForm.quantity), unit_price: Number(procurementForm.unit_price) }); setProcurementModal(false); setProcurementForm({ ...procurementForm, item_name: '', quantity: '', unit_price: '' }); showNotice('Procurement request created.'); await loadDashboardData(); }
    catch (error) { showNotice(error.message); }
  };

  const saveMaterialRequest = async (event) => {
    event.preventDefault();
    try { await api.createMaterialRequest({ ...requestForm, project_id: Number(requestForm.project_id), inventory_id: Number(requestForm.inventory_id), quantity: Number(requestForm.quantity) }); setRequestModal(false); showNotice('Material request submitted.'); await loadDashboardData(); }
    catch (error) { showNotice(error.message); }
  };

  const saveMaterialAllocation = async (event) => {
    event.preventDefault();
    try { await api.createMaterialAllocation({ ...allocationForm, project_id: Number(allocationForm.project_id), inventory_id: Number(allocationForm.inventory_id), quantity: Number(allocationForm.quantity) }); setAllocationModal(false); showNotice('Material allocated.'); await loadDashboardData(); }
    catch (error) { showNotice(error.message); }
  };

  const saveWorkforceAllocation = async (event) => {
    event.preventDefault();
    try { await api.createWorkforceAllocation({ ...workforceAllocationForm, worker_id: Number(workforceAllocationForm.worker_id), project_id: Number(workforceAllocationForm.project_id) }); setWorkforceAllocationModal(false); showNotice('Worker allocated.'); await loadDashboardData(); }
    catch (error) { showNotice(error.message); }
  };

  const saveShift = async (event) => {
    event.preventDefault();
    try { await api.createShift({ ...shiftForm, project_id: Number(shiftForm.project_id) }); setShiftModal(false); showNotice('Shift scheduled.'); await loadDashboardData(); }
    catch (error) { showNotice(error.message); }
  };

  const savePayroll = async (event) => {
    event.preventDefault();
    try {
      const days = Number(payrollForm.days_worked || 0);
      const wage = Number(payrollForm.daily_wage || 0);
      const overtime = Number(payrollForm.overtime || 0);
      const deductions = Number(payrollForm.deductions || 0);
      const net_pay = days * wage + overtime - deductions;
      await api.createPayroll({ ...payrollForm, worker_id: Number(payrollForm.worker_id), project_id: payrollForm.project_id ? Number(payrollForm.project_id) : null, days_worked: days, daily_wage: wage, overtime, deductions, net_pay });
      setPayrollModal(false); showNotice('Payroll record created.'); await loadDashboardData();
    } catch (error) { showNotice(error.message); }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    showNotice('Profile editing API is not part of this Milestone 2 update.');
    setEditProfile(false);
  };

  const openProject = (mode, item = null) => { setProjectForm(item ? { ...emptyProject, ...item } : emptyProject); setProjectModal({ mode, item }); };
  const openResource = (mode, item = null) => { setResourceForm(item ? { ...emptyResource, ...item, project_id: item.project_id || item.assigned_project_id || '', status: item.status || item.availability_status || 'AVAILABLE' } : emptyResource); setResourceModal({ mode, item }); };
  const openInventory = (mode, item = null) => { setInventoryForm(item ? { ...emptyInventory, ...item } : emptyInventory); setInventoryModal({ mode, item }); };
  const openWorker = (mode, item = null) => { setWorkerForm(item ? { ...emptyWorker, ...item, password_hash: '' } : emptyWorker); setWorkerModal({ mode, item }); };

  return (
    <div className="flex-1 flex overflow-hidden">
      <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-4 hidden md:flex flex-col justify-between shrink-0">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">BuildTrack</p>
          <TabButton active={activeTab === 'overview'} icon={Activity} label="Overview" onClick={() => setActiveTab('overview')} />
          <TabButton active={activeTab === 'projects'} icon={FolderKanban} label={`Projects (${projects.length})`} onClick={() => setActiveTab('projects')} />
          <TabButton active={activeTab === 'milestones'} icon={SlidersHorizontal} label="Milestones / Progress" onClick={() => setActiveTab('milestones')} />
          <TabButton active={activeTab === 'resources'} icon={Truck} label="Machinery & Resources" onClick={() => setActiveTab('resources')} />
          <TabButton active={activeTab === 'inventory'} icon={Layers} label="Materials & Inventory" onClick={() => setActiveTab('inventory')} />
          <TabButton active={activeTab === 'workforce'} icon={Users} label="Workers & Attendance" onClick={() => setActiveTab('workforce')} />
          <TabButton active={activeTab === 'procurement'} icon={ShoppingCart} label="Procurement" onClick={() => setActiveTab('procurement')} />
          <TabButton active={activeTab === 'shifts'} icon={Calendar} label="Shift Scheduling" onClick={() => setActiveTab('shifts')} />
          <TabButton active={activeTab === 'payroll'} icon={CheckCircle2} label="Payroll" onClick={() => setActiveTab('payroll')} />
          <TabButton active={activeTab === 'notifications'} icon={Bell} label="Notifications" onClick={() => setActiveTab('notifications')} />
          <TabButton active={activeTab === 'profile'} icon={UserCheck} label="Profile" onClick={() => setActiveTab('profile')} />
        </div>
        <div className="space-y-3">
          <button onClick={loadDashboardData} className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block">Signed in as</span>
            <p className="text-xs font-black text-amber-400 truncate">{currentUser?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 font-mono">{(currentUser?.role || '').toUpperCase()}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {notice && <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">{notice}</div>}
        {loading && <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">Loading latest project data...</div>}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Construction Project Management</p>
                <h2 className="text-2xl font-black text-white mt-1">{projects[0]?.name || 'BuildTrack'}</h2>
                <p className="text-xs text-slate-400 mt-1">Manage projects, resources, materials and workforce.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-right"><p className="text-[10px] text-slate-400">Portfolio Budget</p><p className="text-sm font-black text-white">${totalBudget.toLocaleString()}</p></div>
                <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-right"><p className="text-[10px] text-amber-400">Overall Progress</p><p className="text-sm font-black text-amber-400">{overallProgress}%</p></div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Metric title="Projects" value={projects.length} icon={FolderKanban} />
              <Metric title="Resources" value={resources.length} icon={Truck} />
              <Metric title="Materials" value={inventory.length} icon={Layers} extra={lowStockCount ? `${lowStockCount} low stock` : 'Stock healthy'} />
              <Metric title="Workers" value={workers.length} icon={Users} extra={`${attendance.length} attendance records`} />
            </div>
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="flex justify-between mb-3"><h3 className="font-bold text-white">Project Progress</h3><span className="text-amber-400 font-bold text-sm">{overallProgress}%</span></div>
              <div className="h-3 bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${overallProgress}%` }} /></div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <Section title="Project Management" subtitle="Create, schedule, update, track and close projects" action={<Button onClick={() => openProject('create')}><Plus className="h-4 w-4" /> Create Project</Button>}>
            {projects.length === 0 ? <Empty text="No projects available" /> : <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {projects.map((project) => <Card key={project.id}>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-[10px] text-amber-400 font-mono uppercase">Project #{project.id}</p><h3 className="text-base font-black text-white">{project.name}</h3><p className="text-xs text-slate-400 mt-1">{project.description}</p></div>
                  <StatusBadge status={project.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs mt-4">
                  <Info label="Category" value={project.category} /><Info label="Location" value={project.location || 'N/A'} /><Info label="Start" value={project.start_date || 'Not set'} /><Info label="End" value={project.end_date || 'Not set'} /><Info label="Budget" value={`$${Number(project.budget || 0).toLocaleString()}`} /><Info label="Manager" value={project.manager_id || 'Assigned'} />
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
                  <ActionButton icon={Edit3} text="Edit" onClick={() => openProject('edit', project)} />
                  {project.status !== 'closed' && project.status !== 'completed' && <ActionButton icon={CheckCircle2} text="Close" onClick={() => closeProject(project.id)} />}
                  <ActionButton danger icon={Trash2} text="Delete" onClick={() => deleteProject(project.id)} />
                </div>
              </Card>)}
            </div>}
          </Section>
        )}

        {activeTab === 'milestones' && (
          <Section title="Milestone & Progress Tracking" subtitle="Track project milestones and completion percentage">
            {milestones.length === 0 ? <Empty text="No milestones found" /> : <div className="space-y-4">{milestones.map((m) => { const pct = Number(m.completion_pct || 0); return <Card key={m.id}>
              <div className="flex justify-between items-center gap-3"><div><p className="text-[10px] text-amber-400 font-mono">Milestone #{m.id}</p><h3 className="font-bold text-white">{m.name || m.title}</h3><p className="text-xs text-slate-400">{m.description}</p></div><span className="text-amber-400 font-mono font-bold">{pct}%</span></div>
              <div className="mt-4"><input type="range" min="0" max="100" value={pct} onChange={(e) => updateProgress(m, e.target.value)} className="w-full accent-amber-500" /><div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>Pending</span><span>Completed</span></div></div>
            </Card>; })}</div>}
          </Section>
        )}

        {activeTab === 'resources' && (
          <Section title="Resource Management" subtitle="Allocate machinery, track utilization, availability and maintenance" action={<Button onClick={() => openResource('create')}><Plus className="h-4 w-4" /> Add Resource</Button>}>
            {resources.length === 0 ? <Empty text="No resources available" /> : <div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr><Th>Asset</Th><Th>Category</Th><Th>Project</Th><Th>Quantity</Th><Th>Utilization</Th><Th>Availability</Th><Th>Maintenance</Th><Th>Actions</Th></tr></thead><tbody className="divide-y divide-slate-800">{resources.map((r) => <tr key={r.id} className="hover:bg-slate-800/40"><Td>{r.name}</Td><Td>{r.category}</Td><Td>{r.project_id || r.assigned_project_id || 'Unassigned'}</Td><Td>{r.quantity}</Td><Td>{r.utilization_percentage ?? 0}%</Td><Td><StatusBadge status={r.status || r.availability_status} /></Td><Td>{r.maintenance_date || 'Not scheduled'}</Td><Td><div className="flex gap-2"><ActionButton icon={Edit3} text="Edit" onClick={() => openResource('edit', r)} /><ActionButton danger icon={Trash2} text="Delete" onClick={async () => { if (window.confirm('Delete this resource?')) { try { await api.deleteResource(r.id); await loadDashboardData(); showNotice('Resource deleted.'); } catch (e) { showNotice(e.message); } } }} /></div></Td></tr>)}</tbody></table></div>}
          </Section>
        )}

        {activeTab === 'inventory' && (
          <Section title="Material & Inventory Management" subtitle="Monitor stock, request materials, allocate stock and manage procurement" action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setRequestModal(true)}>Request Material</Button><Button variant="secondary" onClick={() => setAllocationModal(true)}>Allocate Material</Button><Button onClick={() => setInventoryModal({ mode: 'create', item: null })}><Plus className="h-4 w-4" /> Add Material</Button></div>}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
              <Card><h3 className="font-bold text-white mb-3">Material Requests</h3>{materialRequests.length ? materialRequests.map((r) => <div key={r.id} className="py-2 border-b border-slate-800 text-xs text-slate-300">Project #{r.project_id} • {r.quantity} {r.unit} • {r.status}</div>) : <p className="text-xs text-slate-500">No requests yet.</p>}</Card>
              <Card><h3 className="font-bold text-white mb-3">Material Allocations</h3>{materialAllocations.length ? materialAllocations.map((a) => <div key={a.id} className="py-2 border-b border-slate-800 text-xs text-slate-300">Project #{a.project_id} • {a.quantity} units</div>) : <p className="text-xs text-slate-500">No allocations yet.</p>}</Card>
            </div>
            {inventory.length === 0 ? <Empty text="No inventory items" /> : <div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr><Th>Material</Th><Th>Category</Th><Th>Quantity</Th><Th>Minimum</Th><Th>Unit</Th><Th>Supplier</Th><Th>Status</Th><Th>Actions</Th></tr></thead><tbody className="divide-y divide-slate-800">{inventory.map((item) => { const low = Number(item.quantity || 0) <= Number(item.minimum_stock || 0); return <tr key={item.id}><Td>{item.material_name}</Td><Td>{item.category}</Td><Td>{item.quantity}</Td><Td>{item.minimum_stock}</Td><Td>{item.unit}</Td><Td>{item.supplier || 'N/A'}</Td><Td><span className={low ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{low ? 'Low Stock' : 'Adequate'}</span></Td><Td><div className="flex gap-2"><ActionButton icon={Edit3} text="Edit" onClick={() => openInventory('edit', item)} /><ActionButton danger icon={Trash2} text="Delete" onClick={async () => { if (window.confirm('Delete this material?')) { try { await api.deleteInventory(item.id); await loadDashboardData(); showNotice('Material deleted.'); } catch (e) { showNotice(e.message); } } }} /></div></Td></tr>; })}</tbody></table></div>}
          </Section>
        )}

        {activeTab === 'procurement' && <Section title="Material Procurement" subtitle="Manage material orders and delivery status" action={<Button onClick={() => setProcurementModal(true)}><Plus className="h-4 w-4" /> Create Procurement</Button>}>
          {procurements.length ? <div className="space-y-3">{procurements.map((p) => <Card key={p.id}><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div><p className="text-[10px] text-amber-400">PO #{p.id} • {p.category}</p><h3 className="font-bold text-white">{p.item_name}</h3><p className="text-xs text-slate-400">Qty: {p.quantity} • Supplier: {p.supplier || 'N/A'}</p></div><StatusBadge status={p.status} /></div></Card>)}</div> : <Empty text="No procurement records" />}
        </Section>}

        {activeTab === 'workforce' && <Section title="Workforce Management" subtitle="Register workers, record attendance and allocate workforce" action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setAttendanceModal(true)}>Record Attendance</Button><Button variant="secondary" onClick={() => setWorkforceAllocationModal(true)}>Allocate Worker</Button><Button onClick={() => openWorker('create')}><Plus className="h-4 w-4" /> Register Worker</Button></div>}>
          <Card><div className="flex items-center justify-between mb-3"><h3 className="font-bold text-white">Workers</h3><span className="text-xs text-slate-400">{workforceAllocations.length} allocations</span></div>{workers.length ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{workers.map((w) => <div key={w.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800"><p className="font-bold text-white">{w.name}</p><p className="text-xs text-slate-400">{w.email}</p><p className="text-xs text-amber-400 mt-1">{w.role}</p><div className="flex gap-2 mt-3"><ActionButton icon={Edit3} text="Edit" onClick={() => openWorker('edit', w)} /><ActionButton danger icon={Trash2} text="Delete" onClick={async () => { if (window.confirm('Delete this worker?')) { try { await api.deleteWorker(w.id); await loadDashboardData(); showNotice('Worker deleted.'); } catch (e) { showNotice(e.message); } } }} /></div></div>)}</div> : <Empty text="No workers registered" />}</Card>
          <Card><h3 className="font-bold text-white mb-3">Attendance</h3>{attendance.length ? <div className="space-y-2">{attendance.slice(0, 10).map((a) => <div key={a.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-950"><span className="text-xs text-slate-300">Worker #{a.worker_id} • {a.attendance_date}</span><span className="text-xs text-amber-400">{a.status} • {a.check_in || '--:--'} - {a.check_out || '--:--'}</span></div>)}</div> : <Empty text="No attendance records" />}</Card>
        </Section>}

        {activeTab === 'shifts' && <Section title="Shift Scheduling" subtitle="Plan work shifts for construction projects" action={<Button onClick={() => setShiftModal(true)}><Plus className="h-4 w-4" /> Schedule Shift</Button>}>
          {shifts.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{shifts.map((s) => <Card key={s.id}><div className="flex justify-between"><div><p className="font-bold text-white">{s.shift_name}</p><p className="text-xs text-slate-400">Project #{s.project_id}</p></div><StatusBadge status={s.status} /></div><p className="text-xs text-amber-400 mt-3">{s.shift_date} • {s.start_time} - {s.end_time}</p></Card>)}</div> : <Empty text="No shifts scheduled" />}
        </Section>}

        {activeTab === 'payroll' && <Section title="Payroll Monitoring" subtitle="Track worker payroll by project and pay period" action={<Button onClick={() => setPayrollModal(true)}><Plus className="h-4 w-4" /> Add Payroll</Button>}>
          {payroll.length ? <div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr><Th>Worker</Th><Th>Period</Th><Th>Days</Th><Th>Daily Wage</Th><Th>Overtime</Th><Th>Deductions</Th><Th>Net Pay</Th><Th>Status</Th></tr></thead><tbody className="divide-y divide-slate-800">{payroll.map((p) => <tr key={p.id}><Td>{p.worker_id}</Td><Td>{p.pay_period_start} → {p.pay_period_end}</Td><Td>{p.days_worked}</Td><Td>{p.daily_wage}</Td><Td>{p.overtime}</Td><Td>{p.deductions}</Td><Td className="font-bold text-white">{p.net_pay}</Td><Td><StatusBadge status={p.payment_status} /></Td></tr>)}</tbody></table></div> : <Empty text="No payroll records" />}
        </Section>}

        {activeTab === 'notifications' && <Section title="Notifications" subtitle="Project alerts and updates"><div className="space-y-3">{notifications.length ? notifications.map((n) => <Card key={n.id}><div className="flex justify-between gap-3"><div><p className="font-bold text-white">{n.title}</p><p className="text-xs text-slate-400 mt-1">{n.message}</p></div>{!n.is_read && <ActionButton text="Mark Read" onClick={async () => { try { await api.updateNotification(n.id, { is_read: true }); await loadDashboardData(); } catch (e) { showNotice(e.message); } }} />}</div></Card>) : <Empty text="No notifications" />}</div></Section>}

        {activeTab === 'profile' && <Section title="Profile" subtitle="Your account information"><Card><div className="flex items-center gap-4"><div className="h-16 w-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-2xl">{(currentUser?.name || 'U')[0].toUpperCase()}</div><div><h3 className="text-lg font-black text-white">{profileData?.name || currentUser?.name || 'User'}</h3><p className="text-sm text-slate-400">{profileData?.email || currentUser?.email || ''}</p></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"><Info label="Role" value={profileData?.role || currentUser?.role || 'N/A'} /><Info label="Phone" value={profileData?.phone || currentUser?.phone || 'N/A'} /><Info label="Account Status" value="Active" /></div><div className="mt-6"><Button variant="secondary" onClick={() => { setProfileForm({ name: profileData?.name || currentUser?.name || '', email: profileData?.email || currentUser?.email || '', phone: profileData?.phone || currentUser?.phone || '' }); setEditProfile(true); }}>Edit Profile</Button></div></Card></Section>}

      </main>

      {projectModal && <Modal title={projectModal.mode === 'edit' ? 'Edit Project' : 'Create Project'} onClose={() => setProjectModal(null)}><form onSubmit={saveProject} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Project Name"><input className={inputClass} required value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} /></Field><Field label="Category"><select className={inputClass} value={projectForm.category} onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}>{PROJECT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field><Field label="Description"><textarea className={`${inputClass} md:col-span-2`} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} /></Field><Field label="Location"><input className={inputClass} value={projectForm.location} onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} /></Field><Field label="Budget"><input type="number" className={inputClass} value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} /></Field><Field label="Start Date"><input type="date" className={inputClass} value={projectForm.start_date} onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })} /></Field><Field label="End Date"><input type="date" className={inputClass} value={projectForm.end_date} onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })} /></Field><Field label="Status"><select className={inputClass} value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}><option value="planning">Planning</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="closed">Closed</option></select></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Save Project</Button></div></form></Modal>}

      {resourceModal && <Modal title={resourceModal.mode === 'edit' ? 'Edit Resource' : 'Add Resource'} onClose={() => setResourceModal(null)}><form onSubmit={saveResource} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Resource Name"><input className={inputClass} required value={resourceForm.name} onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })} /></Field><Field label="Category"><select className={inputClass} value={resourceForm.category} onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}>{RESOURCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field><Field label="Project"><select className={inputClass} value={resourceForm.project_id} onChange={(e) => setResourceForm({ ...resourceForm, project_id: e.target.value })}><option value="">Unassigned</option>{projects.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></Field><Field label="Quantity"><input type="number" min="0" className={inputClass} value={resourceForm.quantity} onChange={(e) => setResourceForm({ ...resourceForm, quantity: e.target.value })} /></Field><Field label="Utilization %"><input type="number" min="0" max="100" step="0.01" className={inputClass} value={resourceForm.utilization_percentage} onChange={(e) => setResourceForm({ ...resourceForm, utilization_percentage: e.target.value })} /></Field><Field label="Availability"><select className={inputClass} value={resourceForm.status} onChange={(e) => setResourceForm({ ...resourceForm, status: e.target.value })}>{RESOURCE_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field><Field label="Maintenance Date"><input type="date" className={inputClass} value={resourceForm.maintenance_date || ''} onChange={(e) => setResourceForm({ ...resourceForm, maintenance_date: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Save Resource</Button></div></form></Modal>}

      {inventoryModal && <Modal title={inventoryModal.mode === 'edit' ? 'Edit Material' : 'Add Material'} onClose={() => setInventoryModal(null)}><form onSubmit={saveInventory} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Material Name"><input className={inputClass} required value={inventoryForm.material_name} onChange={(e) => setInventoryForm({ ...inventoryForm, material_name: e.target.value })} /></Field><Field label="Category"><select className={inputClass} value={inventoryForm.category} onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value })}>{MATERIAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field><Field label="Project"><select className={inputClass} value={inventoryForm.project_id} onChange={(e) => setInventoryForm({ ...inventoryForm, project_id: e.target.value })}><option value="">None</option>{projects.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></Field><Field label="Quantity"><input type="number" className={inputClass} value={inventoryForm.quantity} onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })} /></Field><Field label="Minimum Stock"><input type="number" className={inputClass} value={inventoryForm.minimum_stock} onChange={(e) => setInventoryForm({ ...inventoryForm, minimum_stock: e.target.value })} /></Field><Field label="Unit"><input className={inputClass} value={inventoryForm.unit} onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })} /></Field><Field label="Unit Price"><input type="number" className={inputClass} value={inventoryForm.unit_price} onChange={(e) => setInventoryForm({ ...inventoryForm, unit_price: e.target.value })} /></Field><Field label="Supplier"><input className={inputClass} value={inventoryForm.supplier} onChange={(e) => setInventoryForm({ ...inventoryForm, supplier: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Save Material</Button></div></form></Modal>}

      {workerModal && <Modal title={workerModal.mode === 'edit' ? 'Edit Worker' : 'Register Worker'} onClose={() => setWorkerModal(null)}><form onSubmit={saveWorker} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Name"><input className={inputClass} required value={workerForm.name} onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })} /></Field><Field label="Email"><input type="email" className={inputClass} required value={workerForm.email} onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })} /></Field><Field label="Phone"><input className={inputClass} value={workerForm.phone} onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })} /></Field>{workerModal.mode === 'create' && <Field label="Temporary Password"><input type="password" className={inputClass} required value={workerForm.password_hash} onChange={(e) => setWorkerForm({ ...workerForm, password_hash: e.target.value })} /></Field>}<Field label="Role"><select className={inputClass} value="Worker" disabled><option>Worker</option></select></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Save Worker</Button></div></form></Modal>}

      {attendanceModal && <Modal title="Record Attendance" onClose={() => setAttendanceModal(false)}><form onSubmit={saveAttendance} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Worker"><select className={inputClass} required value={attendanceForm.worker_id} onChange={(e) => setAttendanceForm({ ...attendanceForm, worker_id: e.target.value })}><option value="">Select worker</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field><Field label="Date"><input type="date" className={inputClass} value={attendanceForm.attendance_date} onChange={(e) => setAttendanceForm({ ...attendanceForm, attendance_date: e.target.value })} /></Field><Field label="Status"><select className={inputClass} value={attendanceForm.status} onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}><option>Present</option><option>Absent</option><option>Leave</option></select></Field><Field label="Check In"><input type="time" className={inputClass} value={attendanceForm.check_in} onChange={(e) => setAttendanceForm({ ...attendanceForm, check_in: e.target.value })} /></Field><Field label="Check Out"><input type="time" className={inputClass} value={attendanceForm.check_out} onChange={(e) => setAttendanceForm({ ...attendanceForm, check_out: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Save Attendance</Button></div></form></Modal>}

      {requestModal && <Modal title="Material Request" onClose={() => setRequestModal(false)}><form onSubmit={saveMaterialRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Project"><select className={inputClass} required value={requestForm.project_id} onChange={(e) => setRequestForm({ ...requestForm, project_id: e.target.value })}><option value="">Select project</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Material"><select className={inputClass} required value={requestForm.inventory_id} onChange={(e) => setRequestForm({ ...requestForm, inventory_id: e.target.value })}><option value="">Select material</option>{inventory.map((i) => <option key={i.id} value={i.id}>{i.material_name}</option>)}</select></Field><Field label="Quantity"><input type="number" className={inputClass} required value={requestForm.quantity} onChange={(e) => setRequestForm({ ...requestForm, quantity: e.target.value })} /></Field><Field label="Unit"><input className={inputClass} value={requestForm.unit} onChange={(e) => setRequestForm({ ...requestForm, unit: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Submit Request</Button></div></form></Modal>}

      {allocationModal && <Modal title="Material Allocation" onClose={() => setAllocationModal(false)}><form onSubmit={saveMaterialAllocation} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Project"><select className={inputClass} required value={allocationForm.project_id} onChange={(e) => setAllocationForm({ ...allocationForm, project_id: e.target.value })}><option value="">Select project</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Material"><select className={inputClass} required value={allocationForm.inventory_id} onChange={(e) => setAllocationForm({ ...allocationForm, inventory_id: e.target.value })}><option value="">Select material</option>{inventory.map((i) => <option key={i.id} value={i.id}>{i.material_name}</option>)}</select></Field><Field label="Quantity"><input type="number" className={inputClass} required value={allocationForm.quantity} onChange={(e) => setAllocationForm({ ...allocationForm, quantity: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Allocate Material</Button></div></form></Modal>}

      {workforceAllocationModal && <Modal title="Workforce Allocation" onClose={() => setWorkforceAllocationModal(false)}><form onSubmit={saveWorkforceAllocation} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Worker"><select className={inputClass} required value={workforceAllocationForm.worker_id} onChange={(e) => setWorkforceAllocationForm({ ...workforceAllocationForm, worker_id: e.target.value })}><option value="">Select worker</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field><Field label="Project"><select className={inputClass} required value={workforceAllocationForm.project_id} onChange={(e) => setWorkforceAllocationForm({ ...workforceAllocationForm, project_id: e.target.value })}><option value="">Select project</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Role"><select className={inputClass} value={workforceAllocationForm.role} onChange={(e) => setWorkforceAllocationForm({ ...workforceAllocationForm, role: e.target.value })}>{WORKFORCE_ROLES.map((r) => <option key={r}>{r}</option>)}</select></Field><Field label="Start Date"><input type="date" className={inputClass} value={workforceAllocationForm.start_date} onChange={(e) => setWorkforceAllocationForm({ ...workforceAllocationForm, start_date: e.target.value })} /></Field><Field label="End Date"><input type="date" className={inputClass} value={workforceAllocationForm.end_date} onChange={(e) => setWorkforceAllocationForm({ ...workforceAllocationForm, end_date: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Allocate Worker</Button></div></form></Modal>}

      {shiftModal && <Modal title="Schedule Shift" onClose={() => setShiftModal(false)}><form onSubmit={saveShift} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Project"><select className={inputClass} required value={shiftForm.project_id} onChange={(e) => setShiftForm({ ...shiftForm, project_id: e.target.value })}><option value="">Select project</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Shift Name"><input className={inputClass} required value={shiftForm.shift_name} onChange={(e) => setShiftForm({ ...shiftForm, shift_name: e.target.value })} /></Field><Field label="Date"><input type="date" className={inputClass} value={shiftForm.shift_date} onChange={(e) => setShiftForm({ ...shiftForm, shift_date: e.target.value })} /></Field><Field label="Start Time"><input type="time" className={inputClass} value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })} /></Field><Field label="End Time"><input type="time" className={inputClass} value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Schedule Shift</Button></div></form></Modal>}

      {payrollModal && <Modal title="Add Payroll" onClose={() => setPayrollModal(false)}><form onSubmit={savePayroll} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Worker"><select className={inputClass} required value={payrollForm.worker_id} onChange={(e) => setPayrollForm({ ...payrollForm, worker_id: e.target.value })}><option value="">Select worker</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field><Field label="Project"><select className={inputClass} value={payrollForm.project_id} onChange={(e) => setPayrollForm({ ...payrollForm, project_id: e.target.value })}><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Period Start"><input type="date" required className={inputClass} value={payrollForm.pay_period_start} onChange={(e) => setPayrollForm({ ...payrollForm, pay_period_start: e.target.value })} /></Field><Field label="Period End"><input type="date" required className={inputClass} value={payrollForm.pay_period_end} onChange={(e) => setPayrollForm({ ...payrollForm, pay_period_end: e.target.value })} /></Field><Field label="Days Worked"><input type="number" className={inputClass} value={payrollForm.days_worked} onChange={(e) => setPayrollForm({ ...payrollForm, days_worked: e.target.value })} /></Field><Field label="Daily Wage"><input type="number" className={inputClass} value={payrollForm.daily_wage} onChange={(e) => setPayrollForm({ ...payrollForm, daily_wage: e.target.value })} /></Field><Field label="Overtime"><input type="number" className={inputClass} value={payrollForm.overtime} onChange={(e) => setPayrollForm({ ...payrollForm, overtime: e.target.value })} /></Field><Field label="Deductions"><input type="number" className={inputClass} value={payrollForm.deductions} onChange={(e) => setPayrollForm({ ...payrollForm, deductions: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Save Payroll</Button></div></form></Modal>}

      {procurementModal && <Modal title="Create Procurement" onClose={() => setProcurementModal(false)}><form onSubmit={saveProcurement} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Project"><select className={inputClass} required value={procurementForm.project_id} onChange={(e) => setProcurementForm({ ...procurementForm, project_id: e.target.value })}><option value="">Select project</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Item"><input className={inputClass} required value={procurementForm.item_name} onChange={(e) => setProcurementForm({ ...procurementForm, item_name: e.target.value })} /></Field><Field label="Category"><input className={inputClass} value={procurementForm.category} onChange={(e) => setProcurementForm({ ...procurementForm, category: e.target.value })} /></Field><Field label="Quantity"><input type="number" className={inputClass} value={procurementForm.quantity} onChange={(e) => setProcurementForm({ ...procurementForm, quantity: e.target.value })} /></Field><Field label="Unit Price"><input type="number" className={inputClass} value={procurementForm.unit_price} onChange={(e) => setProcurementForm({ ...procurementForm, unit_price: e.target.value })} /></Field><Field label="Supplier"><input className={inputClass} value={procurementForm.supplier} onChange={(e) => setProcurementForm({ ...procurementForm, supplier: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Create Procurement</Button></div></form></Modal>}

      {editProfile && <Modal title="Edit Profile" onClose={() => setEditProfile(false)}><form onSubmit={saveProfile} className="space-y-4"><Field label="Name"><input className={inputClass} value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></Field><Field label="Email"><input className={inputClass} value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /></Field><Field label="Phone"><input className={inputClass} value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} /></Field><div className="flex justify-end"><Button type="submit">Save</Button></div></form></Modal>}
    </div>
  );
};

const Section = ({ title, subtitle, action, children }) => <div className="space-y-5"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold text-white">{title}</h2><p className="text-xs text-slate-400 mt-1">{subtitle}</p></div>{action}</div>{children}</div>;
const Card = ({ children }) => <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">{children}</div>;
const Empty = ({ text }) => <div className="p-10 rounded-2xl bg-slate-900 border border-slate-800 text-center text-sm text-slate-500">{text}</div>;
const Metric = ({ title, value, icon: Icon, extra }) => <Card><div className="flex items-center justify-between text-slate-400"><span className="text-xs font-semibold">{title}</span><Icon className="h-4 w-4 text-amber-400" /></div><p className="text-2xl font-black text-white mt-2">{value}</p>{extra && <p className="text-[10px] text-slate-500 mt-1">{extra}</p>}</Card>;
const Info = ({ label, value }) => <div><span className="text-[10px] text-slate-500 block">{label}</span><span className="text-sm text-white font-medium break-words">{value}</span></div>;
const Th = ({ children }) => <th className="p-3.5 font-semibold">{children}</th>;
const Td = ({ children, className = '' }) => <td className={`p-3.5 text-slate-300 ${className}`}>{children}</td>;
const ActionButton = ({ icon: Icon, text, onClick, danger = false }) => <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${danger ? 'text-rose-400 hover:bg-rose-500/10' : 'text-amber-400 hover:bg-amber-500/10'}`}><Icon className="h-3.5 w-3.5" />{text}</button>;
const StatusBadge = ({ status }) => <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase">{String(status || 'N/A').replaceAll('_', ' ')}</span>;

export default Dashboard;
