import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Calendar,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  FolderKanban,
  FolderOpen,
  Layers,
  Plus,
  RefreshCw,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  Truck,
  Upload,
  UserCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { Button } from '../components/Button';
import { api } from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const PROJECT_CATEGORIES = ['Residential', 'Commercial', 'Industrial', 'Infrastructure', 'Government Projects'];
const RESOURCE_CATEGORIES = ['EXCAVATORS', 'CONCRETE_MIXERS', 'CRANES', 'DUMP_TRUCKS', 'GENERATORS', 'SAFETY_EQUIPMENT'];
const RESOURCE_STATUSES = ['AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE'];
const MATERIAL_CATEGORIES = ['CEMENT', 'STEEL', 'BRICKS', 'SAND', 'CONCRETE', 'ELECTRICAL_MATERIALS', 'PLUMBING_MATERIALS'];
const WORKFORCE_ROLES = ['Engineer', 'Supervisor', 'Contractor', 'Skilled Worker', 'Unskilled Worker', 'Consultant'];

// Milestone 3 Documents from Suriyan
const DEFAULT_DOCUMENTS = [
  { id: 1, title: 'Purchase Order Summary', category: 'Procurement', owner: 'Procurement Lead', status: 'Approved', revision: 'v2.1', updated: '2026-09-18', fileType: 'PDF' },
  { id: 2, title: 'Vendor Evaluation Sheet', category: 'Procurement', owner: 'Admin', status: 'Review', revision: 'v1.8', updated: '2026-09-17', fileType: 'XLSX' },
  { id: 3, title: 'Site Notification Log', category: 'Notifications', owner: 'Project Manager', status: 'Sent', revision: 'v3.0', updated: '2026-09-19', fileType: 'DOCX' },
  { id: 4, title: 'Safety Alert Memo', category: 'Notifications', owner: 'Site Engineer', status: 'Pending', revision: 'v1.2', updated: '2026-09-15', fileType: 'PDF' },
  { id: 5, title: 'Weekly Procurement Report', category: 'Reports', owner: 'Finance', status: 'Published', revision: 'v4.4', updated: '2026-09-20', fileType: 'PDF' },
  { id: 6, title: 'Stakeholder Update Report', category: 'Reports', owner: 'PMO', status: 'Draft', revision: 'v2.3', updated: '2026-09-16', fileType: 'DOCX' },
];

const DEFAULT_PROJECTS = [
  {
    id: 101,
    name: 'Skyline Commercial Tower - Phase 2',
    description: '34-Story High-Rise Commercial Hub with LEED Platinum Certification',
    category: 'Commercial',
    location: 'Sector 44, Metro Downtown',
    start_date: '2026-01-10',
    end_date: '2027-08-30',
    budget: 4500000,
    status: 'in_progress',
    manager_id: 'Rohitha Mamidisetti',
  },
  {
    id: 102,
    name: 'Metro Elevated Viaduct Package-B',
    description: '14.2 km Dual-Track Pre-cast Box Girder Segment & 6 Stations',
    category: 'Infrastructure',
    location: 'Outer Ring Corridor',
    start_date: '2025-11-01',
    end_date: '2027-03-15',
    budget: 8200000,
    status: 'in_progress',
    manager_id: 'Rohitha Mamidisetti',
  },
  {
    id: 103,
    name: 'Harbor Logistics Warehouse Terminal',
    description: 'Heavy Industrial Automated Storage & Cold-Chain Facility',
    category: 'Industrial',
    location: 'Port Economic Zone',
    start_date: '2026-03-01',
    end_date: '2026-12-20',
    budget: 2800000,
    status: 'planning',
    manager_id: 'Rohitha Mamidisetti',
  },
];

const DEFAULT_MILESTONES = [
  {
    id: 201,
    project_id: 101,
    name: 'Basement Excavation & Piling Foundation',
    description: 'Securing bored cast-in-situ piles and diaphragm retaining walls',
    due_date: '2026-04-15',
    completion_pct: 100,
    status: 'Completed',
  },
  {
    id: 202,
    project_id: 101,
    name: 'Podium & Structural RCC Framing (Floors 1-12)',
    description: 'Post-tensioned slab casting and shear wall reinforcement',
    due_date: '2026-10-30',
    completion_pct: 68,
    status: 'In Progress',
  },
  {
    id: 203,
    project_id: 102,
    name: 'Viaduct Pier Cap Casting & Gantry Launching',
    description: 'Erection of precast concrete segmental spans over intersection',
    due_date: '2026-11-15',
    completion_pct: 45,
    status: 'In Progress',
  },
  {
    id: 204,
    project_id: 103,
    name: 'Pre-Engineered Building (PEB) Steel Rafter Assembly',
    description: 'High-tensile steel truss erection and insulation cladding',
    due_date: '2026-12-05',
    completion_pct: 20,
    status: 'Pending',
  },
];

const DEFAULT_RESOURCES = [
  {
    id: 301,
    name: 'Liebherr 280 EC-H 12 Litronic Tower Crane',
    category: 'CRANES',
    project_id: 101,
    quantity: 2,
    utilization_percentage: 88,
    status: 'IN_USE',
    maintenance_date: '2026-10-05',
  },
  {
    id: 302,
    name: 'CAT 320 Hydraulic Excavator (Heavy Duty)',
    category: 'EXCAVATORS',
    project_id: 102,
    quantity: 4,
    utilization_percentage: 75,
    status: 'IN_USE',
    maintenance_date: '2026-09-28',
  },
  {
    id: 303,
    name: 'Schwing Stetter Concrete Transit Mixer (8m³)',
    category: 'CONCRETE_MIXERS',
    project_id: 101,
    quantity: 6,
    utilization_percentage: 92,
    status: 'IN_USE',
    maintenance_date: '2026-10-12',
  },
  {
    id: 304,
    name: 'Cummins 500 kVA Mobile Silent Generator',
    category: 'GENERATORS',
    project_id: 103,
    quantity: 3,
    utilization_percentage: 30,
    status: 'AVAILABLE',
    maintenance_date: '2026-11-01',
  },
];

const DEFAULT_INVENTORY = [
  {
    id: 401,
    material_name: 'Ultratech OPC 53 Grade Cement',
    category: 'CEMENT',
    project_id: 101,
    quantity: 2400,
    minimum_stock: 500,
    unit: 'Bags (50kg)',
    unit_price: 6.5,
    supplier: 'Ultratech Building Supplies Ltd',
  },
  {
    id: 402,
    material_name: 'Tata Tiscon Fe 550D TMT Rebar (16mm)',
    category: 'STEEL',
    project_id: 101,
    quantity: 48,
    minimum_stock: 15,
    unit: 'Metric Tons',
    unit_price: 850,
    supplier: 'Tata Steel Infrastructure',
  },
  {
    id: 403,
    material_name: 'Ready-Mix Concrete Grade M40',
    category: 'CONCRETE',
    project_id: 102,
    quantity: 120,
    minimum_stock: 150,
    unit: 'm³',
    unit_price: 95,
    supplier: 'ACC ReadyMix Logistics',
  },
  {
    id: 404,
    material_name: 'High-Density AAC Autoclaved Aerated Blocks',
    category: 'BRICKS',
    project_id: 103,
    quantity: 8500,
    minimum_stock: 2000,
    unit: 'Blocks',
    unit_price: 1.8,
    supplier: 'EcoBuild Masonry Corp',
  },
];

const DEFAULT_WORKERS = [
  { id: 501, name: 'Suresh Kumar', email: 'suresh.k@buildtrack.com', phone: '+91 98450 11201', role: 'Site Supervisor' },
  { id: 502, name: 'Vikramjit Singh', email: 'vikram.singh@buildtrack.com', phone: '+91 98762 33412', role: 'Lead Structural Engineer' },
  { id: 503, name: 'Mohammed Farooq', email: 'm.farooq@buildtrack.com', phone: '+91 97120 44510', role: 'Safety Inspector' },
  { id: 504, name: 'Ramesh Patel', email: 'ramesh.p@buildtrack.com', phone: '+91 98234 55678', role: 'Crane Master Operator' },
];

const DEFAULT_SHIFTS = [
  { id: 601, project_id: 101, shift_name: 'Morning Foundation Pouring Shift', shift_date: '2026-09-21', start_time: '07:00', end_time: '15:30', status: 'SCHEDULED' },
  { id: 602, project_id: 102, shift_name: 'Night Viaduct Gantry Erection', shift_date: '2026-09-21', start_time: '21:00', end_time: '05:30', status: 'SCHEDULED' },
];

const DEFAULT_NOTIFICATIONS = [
  { id: 701, title: 'Concrete Strength Report Approved', message: 'M40 28-day compression cube test for Pier Cap 14 has passed QA certification (44.2 MPa).', is_read: false },
  { id: 702, title: 'Low Stock Alert: Ready-Mix M40', message: 'Ready-Mix Concrete inventory has dropped below the minimum reserve threshold of 150 m³.', is_read: false },
  { id: 703, title: 'Quarterly Safety Audit Cleared', message: 'Tower Crane 01 & 02 passed third-party load test and structural cable inspection.', is_read: true },
];

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
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-white">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-black text-white">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
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
    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
      active
        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
    }`}
  >
    <Icon className="h-4 w-4" />
    <span>{label}</span>
  </button>
);

export const Dashboard = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES);
  const [resources, setResources] = useState(DEFAULT_RESOURCES);
  const [inventory, setInventory] = useState(DEFAULT_INVENTORY);
  const [procurements, setProcurements] = useState([]);
  const [workers, setWorkers] = useState(DEFAULT_WORKERS);
  const [attendance, setAttendance] = useState([
    { id: 1, worker_id: 501, attendance_date: '2026-09-20', status: 'Present', check_in: '07:45', check_out: '16:30' },
    { id: 2, worker_id: 502, attendance_date: '2026-09-20', status: 'Present', check_in: '08:00', check_out: '17:15' },
    { id: 3, worker_id: 503, attendance_date: '2026-09-20', status: 'Present', check_in: '07:30', check_out: '16:00' },
  ]);
  const [materialRequests, setMaterialRequests] = useState([]);
  const [materialAllocations, setMaterialAllocations] = useState([]);
  const [workforceAllocations, setWorkforceAllocations] = useState([]);
  const [shifts, setShifts] = useState(DEFAULT_SHIFTS);
  const [payroll, setPayroll] = useState([
    { id: 1, worker_id: 501, pay_period_start: '2026-09-01', pay_period_end: '2026-09-15', days_worked: 14, daily_wage: 65, overtime: 120, deductions: 20, net_pay: 1010, payment_status: 'PAID' },
    { id: 2, worker_id: 502, pay_period_start: '2026-09-01', pay_period_end: '2026-09-15', days_worked: 15, daily_wage: 90, overtime: 150, deductions: 35, net_pay: 1465, payment_status: 'PAID' },
  ]);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [documents, setDocuments] = useState(DEFAULT_DOCUMENTS);

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
  const [documentForm, setDocumentForm] = useState({ category: 'Procurement', owner: '', status: 'Draft', revision: 'v1.0' });
  const [documentFile, setDocumentFile] = useState(null);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const overallProgress = useMemo(() => {
    if (!milestones.length) return 0;
    return Math.round(milestones.reduce((sum, item) => sum + Number(item.completion_pct || 0), 0) / milestones.length);
  }, [milestones]);

  const totalBudget = useMemo(() => projects.reduce((sum, p) => sum + Number(p.budget || 0), 0), [projects]);
  const lowStockCount = inventory.filter((item) => Number(item.quantity ?? 0) <= Number(item.minimum_stock ?? 0)).length;

  const saveProject = async (event) => {
    event.preventDefault();
    setProjects([{ ...projectForm, id: Date.now() }, ...projects]);
    setProjectModal(null);
    setProjectForm(emptyProject);
    showNotice('Project updated successfully.');
  };

  const closeProject = async (id) => {
    setProjects(projects.map((p) => p.id === id ? { ...p, status: 'closed' } : p));
    showNotice('Project closed.');
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    setProjects(projects.filter((p) => p.id !== id));
    showNotice('Project deleted.');
  };

  const saveResource = async (event) => {
    event.preventDefault();
    const payload = { ...resourceForm, id: Date.now(), quantity: Number(resourceForm.quantity), utilization_percentage: Number(resourceForm.utilization_percentage) };
    setResources([payload, ...resources]);
    setResourceModal(null); setResourceForm(emptyResource); showNotice('Resource saved.');
  };

  const saveInventory = async (event) => {
    event.preventDefault();
    const payload = { ...inventoryForm, id: Date.now(), quantity: Number(inventoryForm.quantity), minimum_stock: Number(inventoryForm.minimum_stock) };
    setInventory([payload, ...inventory]);
    setInventoryModal(null); setInventoryForm(emptyInventory); showNotice('Inventory saved.');
  };

  const saveWorker = async (event) => {
    event.preventDefault();
    const payload = { id: Date.now(), name: workerForm.name, email: workerForm.email, phone: workerForm.phone, role: 'Site Worker' };
    setWorkers([payload, ...workers]);
    setWorkerModal(null); setWorkerForm(emptyWorker); showNotice('Worker registered.');
  };

  const saveAttendance = async (event) => {
    event.preventDefault();
    setAttendance([{ ...attendanceForm, id: Date.now() }, ...attendance]);
    setAttendanceModal(false); showNotice('Attendance logged.');
  };

  const updateProgress = (milestone, value) => {
    const pct = Number(value);
    const status = pct === 100 ? 'Completed' : pct === 0 ? 'Pending' : 'In Progress';
    setMilestones(milestones.map((m) => m.id === milestone.id ? { ...m, completion_pct: pct, status } : m));
    showNotice('Milestone progress updated.');
  };

  const handleDocumentUpload = (event) => {
    event.preventDefault();
    if (!documentFile) {
      showNotice('Please select a document file.');
      return;
    }
    const newDoc = {
      id: Date.now(),
      title: documentFile.name,
      category: documentForm.category || 'Procurement',
      owner: documentForm.owner || currentUser?.name || 'Rohitha Mamidisetti',
      status: documentForm.status || 'Draft',
      revision: documentForm.revision || 'v1.0',
      fileType: documentFile.name.split('.').pop()?.toUpperCase() || 'PDF',
      updated: new Date().toISOString().slice(0, 10),
    };
    setDocuments([newDoc, ...documents]);
    setDocumentFile(null);
    event.target.reset();
    showNotice('Document uploaded successfully to Vault.');
  };

  const handleDeleteDocument = (id) => {
    if (!window.confirm('Delete this document?')) return;
    setDocuments(documents.filter((doc) => doc.id !== id));
    showNotice('Document deleted.');
  };

  const openProject = (mode, item = null) => { setProjectForm(item ? { ...emptyProject, ...item } : emptyProject); setProjectModal({ mode, item }); };
  const openResource = (mode, item = null) => { setResourceForm(item ? { ...emptyResource, ...item } : emptyResource); setResourceModal({ mode, item }); };
  const openInventory = (mode, item = null) => { setInventoryForm(item ? { ...emptyInventory, ...item } : emptyInventory); setInventoryModal({ mode, item }); };
  const openWorker = (mode, item = null) => { setWorkerForm(item ? { ...emptyWorker, ...item } : emptyWorker); setWorkerModal({ mode, item }); };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950 text-slate-100 min-h-screen">
      {/* Dark Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/95 p-4 hidden md:flex flex-col justify-between shrink-0 shadow-xl">
        <div className="space-y-1.5">
          <div className="px-3 py-2 flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
            <p className="text-xs font-black tracking-widest text-amber-400 uppercase">BuildTrack Core</p>
          </div>
          <TabButton active={activeTab === 'overview'} icon={Activity} label="Overview" onClick={() => setActiveTab('overview')} />
          <TabButton active={activeTab === 'projects'} icon={FolderKanban} label={`Projects (${projects.length})`} onClick={() => setActiveTab('projects')} />
          <TabButton active={activeTab === 'milestones'} icon={SlidersHorizontal} label={`Phase Progress (${milestones.length})`} onClick={() => setActiveTab('milestones')} />
          <TabButton active={activeTab === 'resources'} icon={Truck} label={`Machinery & Fleet (${resources.length})`} onClick={() => setActiveTab('resources')} />
          <TabButton active={activeTab === 'inventory'} icon={Layers} label={`Materials & Inventory (${inventory.length})`} onClick={() => setActiveTab('inventory')} />
          <TabButton active={activeTab === 'workforce'} icon={Users} label={`Workforce & Shifts (${workers.length})`} onClick={() => setActiveTab('workforce')} />
          <TabButton active={activeTab === 'procurement'} icon={ShoppingCart} label="Procurement Orders" onClick={() => setActiveTab('procurement')} />
          <TabButton active={activeTab === 'documents'} icon={FolderOpen} label={`Documents Vault (${documents.length})`} onClick={() => setActiveTab('documents')} />
          <TabButton active={activeTab === 'shifts'} icon={Calendar} label="Shift Scheduling" onClick={() => setActiveTab('shifts')} />
          <TabButton active={activeTab === 'payroll'} icon={CheckCircle2} label="Payroll Monitoring" onClick={() => setActiveTab('payroll')} />
          <TabButton active={activeTab === 'notifications'} icon={Bell} label="Safety Notifications" onClick={() => setActiveTab('notifications')} />
          <TabButton active={activeTab === 'profile'} icon={UserCheck} label="Manager Profile" onClick={() => setActiveTab('profile')} />
        </div>
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block">Active Session</span>
            <p className="text-xs font-black text-amber-400 truncate">{currentUser?.name || 'Rohitha Mamidisetti'}</p>
            <p className="text-[10px] text-slate-400 font-mono">PROJECT MANAGER</p>
          </div>
        </div>
      </aside>

      {/* Main Dark Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-950">
        {notice && <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">{notice}</div>}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Enterprise Construction Operations</p>
                <h2 className="text-2xl font-black text-white mt-1">{projects[0]?.name}</h2>
                <p className="text-xs text-slate-400 mt-1">Multi-site portfolio status, heavy machinery fleet, and milestone governance.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-right"><p className="text-[10px] text-slate-400">Portfolio Budget</p><p className="text-sm font-black text-white">${totalBudget.toLocaleString()}</p></div>
                <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-right"><p className="text-[10px] text-amber-400">Overall Progress</p><p className="text-sm font-black text-amber-400">{overallProgress}%</p></div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Metric title="Projects" value={projects.length} icon={FolderKanban} />
              <Metric title="Machinery & Fleet" value={resources.length} icon={Truck} extra="88% Fleet Utilization" />
              <Metric title="Materials Inventory" value={inventory.length} icon={Layers} extra={lowStockCount ? `${lowStockCount} low stock` : 'Stock healthy'} />
              <Metric title="Active Workforce" value={workers.length} icon={Users} extra={`${attendance.length} logged shifts today`} />
            </div>
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex justify-between mb-3"><h3 className="font-bold text-white">Overall Milestone Completion</h3><span className="text-amber-400 font-bold text-sm">{overallProgress}%</span></div>
              <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800"><div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500" style={{ width: `${overallProgress}%` }} /></div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <Section title="Project Portfolio" subtitle="Monitor and manage all active capital works" action={<Button onClick={() => openProject('create')}><Plus className="h-4 w-4" /> Create Project</Button>}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {projects.map((project) => <Card key={project.id}>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-[10px] text-amber-400 font-mono uppercase">Project #{project.id}</p><h3 className="text-base font-black text-white">{project.name}</h3><p className="text-xs text-slate-400 mt-1">{project.description}</p></div>
                  <StatusBadge status={project.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs mt-4">
                  <Info label="Category" value={project.category} /><Info label="Location" value={project.location} /><Info label="Start" value={project.start_date} /><Info label="End" value={project.end_date} /><Info label="Budget" value={`$${Number(project.budget).toLocaleString()}`} /><Info label="Manager" value={project.manager_id} />
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
                  <ActionButton icon={Edit3} text="Edit" onClick={() => openProject('edit', project)} />
                  {project.status !== 'closed' && <ActionButton icon={CheckCircle2} text="Close" onClick={() => closeProject(project.id)} />}
                  <ActionButton danger icon={Trash2} text="Delete" onClick={() => deleteProject(project.id)} />
                </div>
              </Card>)}
            </div>
          </Section>
        )}

        {activeTab === 'milestones' && (
          <Section title="Phase & Milestone Progress" subtitle="Interactive completion sliders update overall portfolio completion">
            <div className="space-y-4">{milestones.map((m) => { const pct = Number(m.completion_pct || 0); return <Card key={m.id}>
              <div className="flex justify-between items-center gap-3"><div><p className="text-[10px] text-amber-400 font-mono">Milestone #{m.id} • Due {m.due_date}</p><h3 className="font-bold text-white text-base">{m.name}</h3><p className="text-xs text-slate-400">{m.description}</p></div><span className="text-amber-400 font-mono font-black text-lg">{pct}%</span></div>
              <div className="mt-4"><input type="range" min="0" max="100" value={pct} onChange={(e) => updateProgress(m, e.target.value)} className="w-full accent-amber-500 cursor-pointer" /><div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>Planning (0%)</span><span className="text-amber-400 font-bold">{m.status}</span><span>Completed (100%)</span></div></div>
            </Card>; })}</div>
          </Section>
        )}

        {activeTab === 'resources' && (
          <Section title="Heavy Machinery & Equipment" subtitle="Machinery deployment, maintenance schedules, and utilization" action={<Button onClick={() => openResource('create')}><Plus className="h-4 w-4" /> Add Asset</Button>}>
            <div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr><Th>Asset / Machinery</Th><Th>Category</Th><Th>Deployment Site</Th><Th>Fleet Qty</Th><Th>Utilization</Th><Th>Status</Th><Th>Next Maintenance</Th><Th>Actions</Th></tr></thead><tbody className="divide-y divide-slate-800">{resources.map((r) => <tr key={r.id} className="hover:bg-slate-800/40"><Td className="font-bold text-white">{r.name}</Td><Td>{r.category}</Td><Td>Project #{r.project_id}</Td><Td>{r.quantity} Units</Td><Td className="text-amber-400 font-semibold">{r.utilization_percentage}%</Td><Td><StatusBadge status={r.status} /></Td><Td>{r.maintenance_date}</Td><Td><div className="flex gap-2"><ActionButton icon={Edit3} text="Edit" onClick={() => openResource('edit', r)} /><ActionButton danger icon={Trash2} text="Delete" onClick={() => { setResources(resources.filter(x => x.id !== r.id)); showNotice('Resource deleted.'); }} /></div></Td></tr>)}</tbody></table></div>
          </Section>
        )}

        {activeTab === 'inventory' && (
          <Section title="Material Stockpile & Inventory" subtitle="Bulk materials, rebar, cement, and concrete stock reserves" action={<Button onClick={() => setInventoryModal({ mode: 'create', item: null })}><Plus className="h-4 w-4" /> Add Material</Button>}>
            <div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr><Th>Material</Th><Th>Category</Th><Th>Quantity</Th><Th>Minimum Reserve</Th><Th>Unit</Th><Th>Supplier</Th><Th>Status</Th><Th>Actions</Th></tr></thead><tbody className="divide-y divide-slate-800">{inventory.map((item) => { const low = Number(item.quantity || 0) <= Number(item.minimum_stock || 0); return <tr key={item.id}><Td className="font-bold text-white">{item.material_name}</Td><Td>{item.category}</Td><Td className="font-mono">{item.quantity} {item.unit}</Td><Td className="font-mono text-slate-400">{item.minimum_stock} {item.unit}</Td><Td>{item.unit}</Td><Td>{item.supplier}</Td><Td><span className={low ? 'px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'}>{low ? 'Low Stock' : 'Optimal'}</span></Td><Td><div className="flex gap-2"><ActionButton icon={Edit3} text="Edit" onClick={() => openInventory('edit', item)} /><ActionButton danger icon={Trash2} text="Delete" onClick={() => { setInventory(inventory.filter(x => x.id !== item.id)); showNotice('Material deleted.'); }} /></div></Td></tr>; })}</tbody></table></div>
          </Section>
        )}

        {/* DOCUMENTS VAULT TAB */}
        {activeTab === 'documents' && (
          <Section
            title="Documents Vault (Milestone 3)"
            subtitle="Centralized repository for construction blueprints, municipal permits, and quality test records"
          >
            <Card>
              <form onSubmit={handleDocumentUpload} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
                <div className="xl:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Upload File (PDF, DOCX, XLSX)</label>
                  <input
                    type="file"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-950 cursor-pointer"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Category</label>
                  <select className={inputClass} value={documentForm.category} onChange={(e) => setDocumentForm({ ...documentForm, category: e.target.value })}>
                    <option value="Procurement">Procurement</option>
                    <option value="Notifications">Notifications</option>
                    <option value="Reports">Reports</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Document Owner</label>
                  <input className={inputClass} value={documentForm.owner} onChange={(e) => setDocumentForm({ ...documentForm, owner: e.target.value })} placeholder="e.g. Lead Engineer" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Approval Status</label>
                  <select className={inputClass} value={documentForm.status} onChange={(e) => setDocumentForm({ ...documentForm, status: e.target.value })}>
                    <option value="Draft">Draft</option>
                    <option value="Review">Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
                <div className="md:col-span-2 xl:col-span-5 flex justify-end">
                  <Button type="submit">
                    <Upload className="h-4 w-4" /> Upload Document
                  </Button>
                </div>
              </form>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
              {['Procurement', 'Notifications', 'Reports'].map((group) => {
                const items = documents.filter((doc) => doc.category === group);
                return (
                  <Card key={group}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        {group === 'Procurement' ? <ShoppingCart className="h-4 w-4" /> : group === 'Notifications' ? <Bell className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Vault Category</p>
                        <h3 className="font-bold text-white">{group}</h3>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {items.map((doc) => (
                        <div key={doc.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-white">{doc.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{doc.owner} • {doc.fileType}</p>
                            </div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              {doc.status}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Rev {doc.revision}</span>
                            <span>{doc.updated}</span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-400 hover:bg-amber-500/10 cursor-pointer">
                              <Download className="h-3 w-3" /> Download
                            </button>
                            <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-red-300 hover:bg-red-500/20 cursor-pointer" onClick={() => handleDeleteDocument(doc.id)}>
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </Section>
        )}

        {activeTab === 'workforce' && <Section title="Workforce Management" subtitle="Register workers, record attendance and allocate workforce" action={<Button onClick={() => openWorker('create')}><Plus className="h-4 w-4" /> Register Worker</Button>}>
          <Card><h3 className="font-bold text-white mb-3">On-Site Personnel</h3><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{workers.map((w) => <div key={w.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800"><p className="font-bold text-white">{w.name}</p><p className="text-xs text-slate-400">{w.email}</p><p className="text-xs text-amber-400 mt-1 font-semibold">{w.role}</p><div className="flex gap-2 mt-3"><ActionButton icon={Edit3} text="Edit" onClick={() => openWorker('edit', w)} /><ActionButton danger icon={Trash2} text="Delete" onClick={() => { setWorkers(workers.filter(x => x.id !== w.id)); showNotice('Worker removed.'); }} /></div></div>)}</div></Card>
        </Section>}

        {activeTab === 'procurement' && <Section title="Procurement Orders" subtitle="Manage material purchase orders and supplier status"><div className="space-y-3"><Card><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div><p className="text-[10px] text-amber-400">PO #501 • RAW_MATERIALS</p><h3 className="font-bold text-white">Structural Grade Cement (OPC 53)</h3><p className="text-xs text-slate-400">Qty: 2500 Bags • Supplier: Ultratech Supplies</p></div><StatusBadge status="Approved" /></div></Card></div></Section>}

        {activeTab === 'shifts' && <Section title="Shift Scheduling" subtitle="Daily operations planning for construction sites"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{shifts.map((s) => <Card key={s.id}><div className="flex justify-between"><div><p className="font-bold text-white">{s.shift_name}</p><p className="text-xs text-slate-400">Project #{s.project_id}</p></div><StatusBadge status={s.status} /></div><p className="text-xs text-amber-400 mt-3">{s.shift_date} • {s.start_time} - {s.end_time}</p></Card>)}</div></Section>}

        {activeTab === 'payroll' && <Section title="Payroll Monitoring" subtitle="Worker compensation and wage records"><div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr><Th>Worker</Th><Th>Period</Th><Th>Days</Th><Th>Daily Wage</Th><Th>Overtime</Th><Th>Deductions</Th><Th>Net Pay</Th><Th>Status</Th></tr></thead><tbody className="divide-y divide-slate-800">{payroll.map((p) => <tr key={p.id}><Td>#{p.worker_id}</Td><Td>{p.pay_period_start} → {p.pay_period_end}</Td><Td>{p.days_worked}</Td><Td>${p.daily_wage}</Td><Td>+${p.overtime}</Td><Td>-${p.deductions}</Td><Td className="font-bold text-white">${p.net_pay}</Td><Td><StatusBadge status={p.payment_status} /></Td></tr>)}</tbody></table></div></Section>}

        {activeTab === 'notifications' && <Section title="Safety & Operations Notifications" subtitle="Real-time site inspection clearances and safety alerts"><div className="space-y-3">{notifications.map((n) => <Card key={n.id}><div className="flex justify-between gap-3"><div><p className="font-bold text-white">{n.title}</p><p className="text-xs text-slate-400 mt-1">{n.message}</p></div>{!n.is_read && <ActionButton text="Mark Read" onClick={() => { setNotifications(notifications.map(x => x.id === n.id ? { ...x, is_read: true } : x)); showNotice('Alert marked read.'); }} />}</div></Card>)}</div></Section>}

        {activeTab === 'profile' && <Section title="Manager Profile" subtitle="Account details and enterprise credentials"><Card><div className="flex items-center gap-4"><div className="h-16 w-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-2xl">R</div><div><h3 className="text-lg font-black text-white">{currentUser?.name || 'Rohitha Mamidisetti'}</h3><p className="text-sm text-slate-400">{currentUser?.email || 'rohitha@buildtrack.com'}</p></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"><Info label="Designation" value="Project Manager" /><Info label="Phone" value="+91 98450 77123" /><Info label="Account Status" value="Active (Enterprise)" /></div></Card></Section>}
      </main>
    </div>
  );
};

const Section = ({ title, subtitle, action, children }) => <div className="space-y-5"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold text-white">{title}</h2><p className="text-xs text-slate-400 mt-1">{subtitle}</p></div>{action}</div>{children}</div>;
const Card = ({ children }) => <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">{children}</div>;
const Metric = ({ title, value, icon: Icon, extra }) => <Card><div className="flex items-center justify-between text-slate-400"><span className="text-xs font-semibold">{title}</span><Icon className="h-4 w-4 text-amber-400" /></div><p className="text-2xl font-black text-white mt-2">{value}</p>{extra && <p className="text-[10px] text-slate-400 mt-1">{extra}</p>}</Card>;
const Info = ({ label, value }) => <div><span className="text-[10px] text-slate-400 block">{label}</span><span className="text-sm text-white font-medium break-words">{value}</span></div>;
const Th = ({ children }) => <th className="p-3.5 font-semibold">{children}</th>;
const Td = ({ children, className = '' }) => <td className={`p-3.5 text-slate-300 ${className}`}>{children}</td>;
const ActionButton = ({ icon: Icon, text, onClick, danger = false }) => <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${danger ? 'bg-red-500/15 text-red-100 border-red-400/40 hover:bg-red-500/25 hover:text-white' : 'text-amber-400 hover:bg-amber-500/10 border-transparent'} `}>{Icon && <Icon className="h-3.5 w-3.5" />}{text}</button>;
const StatusBadge = ({ status }) => <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase">{String(status || 'N/A').replaceAll('_', ' ')}</span>;

export default Dashboard;
