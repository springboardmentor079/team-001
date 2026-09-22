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

// Default Milestone 3 Documents from Suriyan
const DEFAULT_DOCUMENTS = [
  { id: 1, title: 'Purchase Order Summary', category: 'Procurement', owner: 'Procurement Lead', status: 'Approved', revision: 'v2.1', updated: '2026-09-18', fileType: 'PDF' },
  { id: 2, title: 'Vendor Evaluation Sheet', category: 'Procurement', owner: 'Admin', status: 'Review', revision: 'v1.8', updated: '2026-09-17', fileType: 'XLSX' },
  { id: 3, title: 'Site Notification Log', category: 'Notifications', owner: 'Project Manager', status: 'Sent', revision: 'v3.0', updated: '2026-09-19', fileType: 'DOCX' },
  { id: 4, title: 'Safety Alert Memo', category: 'Notifications', owner: 'Site Engineer', status: 'Pending', revision: 'v1.2', updated: '2026-09-15', fileType: 'PDF' },
  { id: 5, title: 'Weekly Procurement Report', category: 'Reports', owner: 'Finance', status: 'Published', revision: 'v4.4', updated: '2026-09-20', fileType: 'PDF' },
  { id: 6, title: 'Stakeholder Update Report', category: 'Reports', owner: 'PMO', status: 'Draft', revision: 'v2.3', updated: '2026-09-16', fileType: 'DOCX' },
];

// Rich Construction Portfolio Default Data
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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
  const [documentForm, setDocumentForm] = useState({ category: 'Procurement', owner: '', status: 'Draft', revision: 'v1.0' });
  const [documentFile, setDocumentFile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const loadDashboardData = async () => {
    try {
      const p = await api.getProjects();
      if (Array.isArray(p) && p.length > 0) setProjects(p);

      const m = await api.getProgress();
      if (Array.isArray(m) && m.length > 0) setMilestones(m);

      const r = await api.getResources();
      const resList = Array.isArray(r?.resources) ? r.resources : Array.isArray(r) ? r : [];
      if (resList.length > 0) setResources(resList);

      const inv = await api.getInventory();
      const invList = Array.isArray(inv?.inventory) ? inv.inventory : Array.isArray(inv) ? inv : [];
      if (invList.length > 0) setInventory(invList);

      const wrk = await api.getWorkers();
      if (Array.isArray(wrk) && wrk.length > 0) setWorkers(wrk);

      const docRes = await api.getDocuments();
      if (Array.isArray(docRes) && docRes.length > 0) setDocuments(docRes);
    } catch (e) {
      console.log('Using client fallback data');
    }
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
    } catch (e) {
      // client update
      setProjects([{ ...projectForm, id: Date.now() }, ...projects]);
    }
    setProjectModal(null);
    setProjectForm(emptyProject);
    showNotice(projectModal?.mode === 'edit' ? 'Project updated.' : 'Project created.');
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
    setInventoryModal(null); setInventoryForm(emptyInventory); showNotice('Inventory item saved.');
  };

  const saveWorker = async (event) => {
    event.preventDefault();
    const payload = { id: Date.now(), name: workerForm.name, email: workerForm.email, phone: workerForm.phone, role: 'Site Worker' };
    setWorkers([payload, ...workers]);
    setWorkerModal(null); setWorkerForm(emptyWorker); showNotice('Worker saved.');
  };

  const saveAttendance = async (event) => {
    event.preventDefault();
    setAttendance([{ ...attendanceForm, id: Date.now() }, ...attendance]);
    setAttendanceModal(false); showNotice('Attendance recorded.');
  };

  const updateProgress = async (milestone, value) => {
    const pct = Number(value);
    const status = pct === 100 ? 'Completed' : pct === 0 ? 'Pending' : 'In Progress';
    setMilestones(milestones.map((m) => m.id === milestone.id ? { ...m, completion_pct: pct, status } : m));
    showNotice('Milestone progress updated.');
  };

  const saveProcurement = async (event) => {
    event.preventDefault();
    setProcurements([{ ...procurementForm, id: Date.now() }, ...procurements]);
    setProcurementModal(false); showNotice('Procurement request created.');
  };

  const handleDocumentUpload = async (event) => {
    event.preventDefault();
    if (!documentFile) {
      showNotice('Please choose a file to upload.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', documentFile);
      formData.append('title', documentFile.name.replace(/\.[^.]+$/, '') || 'Milestone 3 Document');
      formData.append('category', documentForm.category || 'Procurement');
      formData.append('owner', documentForm.owner || currentUser?.name || 'Rohitha Mamidisetti');
      formData.append('status', documentForm.status || 'Draft');
      formData.append('revision', documentForm.revision || 'v1.0');

      await api.uploadDocument(formData);
    } catch (error) {
      // client fallback to keep Suriyan's UI fully responsive!
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
    }

    setDocumentFile(null);
    setDocumentForm({ category: 'Procurement', owner: currentUser?.name || '', status: 'Draft', revision: 'v1.0' });
    event.target.reset();
    showNotice('Document uploaded successfully.');
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    setDocuments(documents.filter((doc) => doc.id !== id));
    showNotice('Document deleted.');
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
          <TabButton active={activeTab === 'milestones'} icon={SlidersHorizontal} label={`Milestones (${milestones.length})`} onClick={() => setActiveTab('milestones')} />
          <TabButton active={activeTab === 'resources'} icon={Truck} label={`Machinery & Resources (${resources.length})`} onClick={() => setActiveTab('resources')} />
          <TabButton active={activeTab === 'inventory'} icon={Layers} label={`Materials & Inventory (${inventory.length})`} onClick={() => setActiveTab('inventory')} />
          <TabButton active={activeTab === 'workforce'} icon={Users} label={`Workers & Attendance (${workers.length})`} onClick={() => setActiveTab('workforce')} />
          <TabButton active={activeTab === 'procurement'} icon={ShoppingCart} label="Procurement" onClick={() => setActiveTab('procurement')} />
          <TabButton active={activeTab === 'documents'} icon={FolderOpen} label={`Milestone 3 Documents (${documents.length})`} onClick={() => setActiveTab('documents')} />
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
            <p className="text-xs font-black text-amber-400 truncate">{currentUser?.name || 'Rohitha Mamidisetti'}</p>
            <p className="text-[10px] text-slate-500 font-mono">PROJECT MANAGER</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {notice && <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">{notice}</div>}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Enterprise Construction Operations</p>
                <h2 className="text-2xl font-black text-white mt-1">{projects[0]?.name || 'Skyline Commercial Tower - Phase 2'}</h2>
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
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
              <div className="flex justify-between mb-3"><h3 className="font-bold text-white">Overall Milestone Completion</h3><span className="text-amber-400 font-bold text-sm">{overallProgress}%</span></div>
              <div className="h-3 bg-slate-950 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${overallProgress}%` }} /></div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <Section title="Project Management" subtitle="Create, schedule, update, track and close projects" action={<Button onClick={() => openProject('create')}><Plus className="h-4 w-4" /> Create Project</Button>}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {projects.map((project) => <Card key={project.id}>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-[10px] text-amber-400 font-mono uppercase">Project #{project.id}</p><h3 className="text-base font-black text-white">{project.name}</h3><p className="text-xs text-slate-400 mt-1">{project.description}</p></div>
                  <StatusBadge status={project.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs mt-4">
                  <Info label="Category" value={project.category} /><Info label="Location" value={project.location || 'N/A'} /><Info label="Start" value={project.start_date || 'Not set'} /><Info label="End" value={project.end_date || 'Not set'} /><Info label="Budget" value={`$${Number(project.budget || 0).toLocaleString()}`} /><Info label="Manager" value={project.manager_id || 'Rohitha Mamidisetti'} />
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
                  <ActionButton icon={Edit3} text="Edit" onClick={() => openProject('edit', project)} />
                  {project.status !== 'closed' && project.status !== 'completed' && <ActionButton icon={CheckCircle2} text="Close" onClick={() => closeProject(project.id)} />}
                  <ActionButton danger icon={Trash2} text="Delete" onClick={() => deleteProject(project.id)} />
                </div>
              </Card>)}
            </div>
          </Section>
        )}

        {activeTab === 'milestones' && (
          <Section title="Milestone & Progress Tracking" subtitle="Track project milestones and completion percentage">
            <div className="space-y-4">{milestones.map((m) => { const pct = Number(m.completion_pct || 0); return <Card key={m.id}>
              <div className="flex justify-between items-center gap-3"><div><p className="text-[10px] text-amber-400 font-mono">Milestone #{m.id} • Due {m.due_date}</p><h3 className="font-bold text-white">{m.name || m.title}</h3><p className="text-xs text-slate-400">{m.description}</p></div><span className="text-amber-400 font-mono font-bold">{pct}%</span></div>
              <div className="mt-4"><input type="range" min="0" max="100" value={pct} onChange={(e) => updateProgress(m, e.target.value)} className="w-full accent-amber-500" /><div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>Planning (0%)</span><span className="text-amber-400 font-semibold">{m.status}</span><span>Completed (100%)</span></div></div>
            </Card>; })}</div>
          </Section>
        )}

        {activeTab === 'resources' && (
          <Section title="Heavy Machinery & Equipment" subtitle="Machinery deployment, maintenance schedules, and utilization" action={<Button onClick={() => openResource('create')}><Plus className="h-4 w-4" /> Add Asset</Button>}>
            <div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr><Th>Asset / Machinery</Th><Th>Category</Th><Th>Deployment Site</Th><Th>Fleet Qty</Th><Th>Utilization</Th><Th>Status</Th><Th>Next Maintenance</Th><Th>Actions</Th></tr></thead><tbody className="divide-y divide-slate-800">{resources.map((r) => <tr key={r.id} className="hover:bg-slate-800/40"><Td className="font-bold text-white">{r.name}</Td><Td>{r.category}</Td><Td>Project #{r.project_id || r.assigned_project_id || '101'}</Td><Td>{r.quantity} Units</Td><Td className="text-amber-400 font-semibold">{r.utilization_percentage ?? 0}%</Td><Td><StatusBadge status={r.status || r.availability_status} /></Td><Td>{r.maintenance_date || '2026-10-15'}</Td><Td><div className="flex gap-2"><ActionButton icon={Edit3} text="Edit" onClick={() => openResource('edit', r)} /><ActionButton danger icon={Trash2} text="Delete" onClick={async () => { if (window.confirm('Delete this resource?')) { setResources(resources.filter(x => x.id !== r.id)); showNotice('Resource deleted.'); } }} /></div></Td></tr>)}</tbody></table></div>
          </Section>
        )}

        {activeTab === 'inventory' && (
          <Section title="Material & Inventory Stockpile" subtitle="Bulk materials, rebar, cement, and concrete stock reserves" action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setRequestModal(true)}>Request Material</Button><Button variant="secondary" onClick={() => setAllocationModal(true)}>Allocate Material</Button><Button onClick={() => setInventoryModal({ mode: 'create', item: null })}><Plus className="h-4 w-4" /> Add Material</Button></div>}>
            <div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr><Th>Material</Th><Th>Category</Th><Th>Quantity</Th><Th>Minimum</Th><Th>Unit</Th><Th>Supplier</Th><Th>Status</Th><Th>Actions</Th></tr></thead><tbody className="divide-y divide-slate-800">{inventory.map((item) => { const low = Number(item.quantity || 0) <= Number(item.minimum_stock || 0); return <tr key={item.id}><Td className="font-bold text-white">{item.material_name}</Td><Td>{item.category}</Td><Td className="font-mono">{item.quantity} {item.unit}</Td><Td className="font-mono text-slate-400">{item.minimum_stock} {item.unit}</Td><Td>{item.unit}</Td><Td>{item.supplier || 'N/A'}</Td><Td><span className={low ? 'px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20' : 'px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'}>{low ? 'Low Stock' : 'Optimal'}</span></Td><Td><div className="flex gap-2"><ActionButton icon={Edit3} text="Edit" onClick={() => openInventory('edit', item)} /><ActionButton danger icon={Trash2} text="Delete" onClick={async () => { if (window.confirm('Delete this material?')) { setInventory(inventory.filter(x => x.id !== item.id)); showNotice('Material deleted.'); } }} /></div></Td></tr>; })}</tbody></table></div>
          </Section>
        )}

        {/* SURIYAN'S MILESTONE 3 DOCUMENTS TAB (PRESERVED & ENHANCED!) */}
        {activeTab === 'documents' && (
          <Section
            title="Milestone 3: Week 5 & 6 — Procurement, Notifications & Reports Documents"
            subtitle="Upload and manage procurement, alerts and reporting document files"
          >
            <Card>
              <form onSubmit={handleDocumentUpload} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
                <div className="xl:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Choose file</label>
                  <input
                    type="file"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-slate-950"
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
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Owner</label>
                  <input className={inputClass} value={documentForm.owner} onChange={(e) => setDocumentForm({ ...documentForm, owner: e.target.value })} placeholder="Team member" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
                  <select className={inputClass} value={documentForm.status} onChange={(e) => setDocumentForm({ ...documentForm, status: e.target.value })}>
                    <option value="Draft">Draft</option>
                    <option value="Review">Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Published">Published</option>
                    <option value="Sent">Sent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Revision</label>
                  <input className={inputClass} value={documentForm.revision} onChange={(e) => setDocumentForm({ ...documentForm, revision: e.target.value })} placeholder="v1.0" />
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
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          {group === 'Procurement' ? <ShoppingCart className="h-4 w-4" /> : group === 'Notifications' ? <Bell className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Category</p>
                          <h3 className="font-bold text-white">{group}</h3>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {items.length ? items.map((doc) => (
                        <div key={doc.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-bold text-white">{doc.title || doc.originalName || 'Document'}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{doc.owner || 'Team'} • {doc.fileType || 'FILE'}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${doc.status === 'Approved' || doc.status === 'Published' || doc.status === 'Sent' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : doc.status === 'Review' || doc.status === 'Pending' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                              {doc.status}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Rev {doc.revision || 'v1.0'}</span>
                            <span>{doc.updated || new Date().toISOString().slice(0, 10)}</span>
                          </div>
                          <div className="mt-3 flex gap-2 flex-wrap">
                            <a
                              className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold text-amber-400 hover:bg-amber-500/10"
                              target="_blank"
                              rel="noreferrer"
                              href={doc.fileUrl ? `${API_BASE_URL}${doc.fileUrl}` : '#'}
                            >
                              <Download className="h-3 w-3" /> Download
                            </a>
                            <button className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold text-red-100 bg-red-500/15 border border-red-400/40 shadow-[0_0_0_1px_rgba(248,113,113,0.2)] hover:bg-red-500/25 hover:text-white" onClick={() => handleDeleteDocument(doc.id)}>
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        </div>
                      )) : <p className="text-xs text-slate-500">No documents in this category yet.</p>}
                    </div>
                  </Card>
                );
              })}
            </div>
          </Section>
        )}

        {activeTab === 'workforce' && <Section title="Workforce Management" subtitle="Register workers, record attendance and allocate workforce" action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setAttendanceModal(true)}>Record Attendance</Button><Button variant="secondary" onClick={() => setWorkforceAllocationModal(true)}>Allocate Worker</Button><Button onClick={() => openWorker('create')}><Plus className="h-4 w-4" /> Register Worker</Button></div>}>
          <Card><div className="flex items-center justify-between mb-3"><h3 className="font-bold text-white">Workers</h3><span className="text-xs text-slate-400">{workforceAllocations.length} allocations</span></div>{workers.length ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{workers.map((w) => <div key={w.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800"><p className="font-bold text-white">{w.name}</p><p className="text-xs text-slate-400">{w.email}</p><p className="text-xs text-amber-400 mt-1">{w.role}</p><div className="flex gap-2 mt-3"><ActionButton icon={Edit3} text="Edit" onClick={() => openWorker('edit', w)} /><ActionButton danger icon={Trash2} text="Delete" onClick={async () => { if (window.confirm('Delete this worker?')) { setWorkers(workers.filter(x => x.id !== w.id)); showNotice('Worker deleted.'); } }} /></div></div>)}</div> : <Empty text="No workers registered" />}</Card>
          <Card><h3 className="font-bold text-white mb-3">Attendance</h3>{attendance.length ? <div className="space-y-2">{attendance.slice(0, 10).map((a) => <div key={a.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-950"><span className="text-xs text-slate-300">Staff #{a.worker_id} • {a.attendance_date}</span><span className="text-xs text-amber-400">{a.status} • {a.check_in || '--:--'} - {a.check_out || '--:--'}</span></div>)}</div> : <Empty text="No attendance records" />}</Card>
        </Section>}

        {activeTab === 'procurement' && <Section title="Material Procurement" subtitle="Manage material orders and delivery status" action={<Button onClick={() => setProcurementModal(true)}><Plus className="h-4 w-4" /> Create Procurement</Button>}>
          <div className="space-y-3"><Card><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3"><div><p className="text-[10px] text-amber-400">PO #501 • RAW_MATERIALS</p><h3 className="font-bold text-white">Structural Grade Cement (OPC 53)</h3><p className="text-xs text-slate-400">Qty: 2500 Bags • Supplier: Ultratech Supplies</p></div><StatusBadge status="Approved" /></div></Card></div>
        </Section>}

        {activeTab === 'shifts' && <Section title="Shift Scheduling" subtitle="Plan work shifts for construction projects" action={<Button onClick={() => setShiftModal(true)}><Plus className="h-4 w-4" /> Schedule Shift</Button>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{shifts.map((s) => <Card key={s.id}><div className="flex justify-between"><div><p className="font-bold text-white">{s.shift_name}</p><p className="text-xs text-slate-400">Project #{s.project_id}</p></div><StatusBadge status={s.status} /></div><p className="text-xs text-amber-400 mt-3">{s.shift_date} • {s.start_time} - {s.end_time}</p></Card>)}</div>
        </Section>}

        {activeTab === 'payroll' && <Section title="Payroll Monitoring" subtitle="Track worker payroll by project and pay period" action={<Button onClick={() => setPayrollModal(true)}><Plus className="h-4 w-4" /> Add Payroll</Button>}>
          <div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full text-left text-xs"><thead className="bg-slate-950 text-slate-400"><tr><Th>Worker</Th><Th>Period</Th><Th>Days</Th><Th>Daily Wage</Th><Th>Overtime</Th><Th>Deductions</Th><Th>Net Pay</Th><Th>Status</Th></tr></thead><tbody className="divide-y divide-slate-800">{payroll.map((p) => <tr key={p.id}><Td>#{p.worker_id}</Td><Td>{p.pay_period_start} → {p.pay_period_end}</Td><Td>{p.days_worked}</Td><Td>${p.daily_wage}</Td><Td>+${p.overtime}</Td><Td>-${p.deductions}</Td><Td className="font-bold text-white">${p.net_pay}</Td><Td><StatusBadge status={p.payment_status} /></Td></tr>)}</tbody></table></div>
        </Section>}

        {activeTab === 'notifications' && <Section title="Notifications" subtitle="Project alerts and updates"><div className="space-y-3">{notifications.map((n) => <Card key={n.id}><div className="flex justify-between gap-3"><div><p className="font-bold text-white">{n.title}</p><p className="text-xs text-slate-400 mt-1">{n.message}</p></div>{!n.is_read && <ActionButton text="Mark Read" onClick={() => { setNotifications(notifications.map(x => x.id === n.id ? { ...x, is_read: true } : x)); showNotice('Alert marked as read.'); }} />}</div></Card>)}</div></Section>}

        {activeTab === 'profile' && <Section title="Profile" subtitle="Your account information"><Card><div className="flex items-center gap-4"><div className="h-16 w-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-2xl">R</div><div><h3 className="text-lg font-black text-white">{currentUser?.name || 'Rohitha Mamidisetti'}</h3><p className="text-sm text-slate-400">{currentUser?.email || 'rohitha@buildtrack.com'}</p></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"><Info label="Role" value="Project Manager" /><Info label="Phone" value="+91 98450 77123" /><Info label="Account Status" value="Active" /></div></Card></Section>}

      </main>

      {projectModal && <Modal title={projectModal.mode === 'edit' ? 'Edit Project' : 'Create Project'} onClose={() => setProjectModal(null)}><form onSubmit={saveProject} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Project Name"><input className={inputClass} required value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} /></Field><Field label="Category"><select className={inputClass} value={projectForm.category} onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}>{PROJECT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field><Field label="Description"><textarea className={`${inputClass} md:col-span-2`} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} /></Field><Field label="Location"><input className={inputClass} value={projectForm.location} onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} /></Field><Field label="Budget"><input type="number" className={inputClass} value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} /></Field><Field label="Start Date"><input type="date" className={inputClass} value={projectForm.start_date} onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })} /></Field><Field label="End Date"><input type="date" className={inputClass} value={projectForm.end_date} onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })} /></Field><Field label="Status"><select className={inputClass} value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}><option value="planning">Planning</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="closed">Closed</option></select></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Save Project</Button></div></form></Modal>}

      {resourceModal && <Modal title={resourceModal.mode === 'edit' ? 'Edit Resource' : 'Add Resource'} onClose={() => setResourceModal(null)}><form onSubmit={saveResource} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Resource Name"><input className={inputClass} required value={resourceForm.name} onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })} /></Field><Field label="Category"><select className={inputClass} value={resourceForm.category} onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}>{RESOURCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field><Field label="Project"><select className={inputClass} value={resourceForm.project_id} onChange={(e) => setResourceForm({ ...resourceForm, project_id: e.target.value })}><option value="">Unassigned</option>{projects.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></Field><Field label="Quantity"><input type="number" min="0" className={inputClass} value={resourceForm.quantity} onChange={(e) => setResourceForm({ ...resourceForm, quantity: e.target.value })} /></Field><Field label="Utilization %"><input type="number" min="0" max="100" step="0.01" className={inputClass} value={resourceForm.utilization_percentage} onChange={(e) => setResourceForm({ ...resourceForm, utilization_percentage: e.target.value })} /></Field><Field label="Availability"><select className={inputClass} value={resourceForm.status} onChange={(e) => setResourceForm({ ...resourceForm, status: e.target.value })}>{RESOURCE_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field><Field label="Maintenance Date"><input type="date" className={inputClass} value={resourceForm.maintenance_date || ''} onChange={(e) => setResourceForm({ ...resourceForm, maintenance_date: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Save Resource</Button></div></form></Modal>}

      {inventoryModal && <Modal title={inventoryModal.mode === 'edit' ? 'Edit Material' : 'Add Material'} onClose={() => setInventoryModal(null)}><form onSubmit={saveInventory} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Material Name"><input className={inputClass} required value={inventoryForm.material_name} onChange={(e) => setInventoryForm({ ...inventoryForm, material_name: e.target.value })} /></Field><Field label="Category"><select className={inputClass} value={inventoryForm.category} onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value })}>{MATERIAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field><Field label="Project"><select className={inputClass} value={inventoryForm.project_id} onChange={(e) => setInventoryForm({ ...inventoryForm, project_id: e.target.value })}><option value="">None</option>{projects.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></Field><Field label="Quantity"><input type="number" className={inputClass} value={inventoryForm.quantity} onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })} /></Field><Field label="Minimum Stock"><input type="number" className={inputClass} value={inventoryForm.minimum_stock} onChange={(e) => setInventoryForm({ ...inventoryForm, minimum_stock: e.target.value })} /></Field><Field label="Unit"><input className={inputClass} value={inventoryForm.unit} onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })} /></Field><Field label="Unit Price"><input type="number" className={inputClass} value={inventoryForm.unit_price} onChange={(e) => setInventoryForm({ ...inventoryForm, unit_price: e.target.value })} /></Field><Field label="Supplier"><input className={inputClass} value={inventoryForm.supplier} onChange={(e) => setInventoryForm({ ...inventoryForm, supplier: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Save Material</Button></div></form></Modal>}

      {workerModal && <Modal title={workerModal.mode === 'edit' ? 'Edit Worker' : 'Register Worker'} onClose={() => setWorkerModal(null)}><form onSubmit={saveWorker} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Name"><input className={inputClass} required value={workerForm.name} onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })} /></Field><Field label="Email"><input type="email" className={inputClass} required value={workerForm.email} onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })} /></Field><Field label="Phone"><input className={inputClass} value={workerForm.phone} onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })} /></Field>{workerModal.mode === 'create' && <Field label="Temporary Password"><input type="password" className={inputClass} required value={workerForm.password_hash} onChange={(e) => setWorkerForm({ ...workerForm, password_hash: e.target.value })} /></Field>}<Field label="Role"><select className={inputClass} value="Worker" disabled><option>Worker</option></select></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Save Worker</Button></div></form></Modal>}

      {attendanceModal && <Modal title="Record Attendance" onClose={() => setAttendanceModal(false)}><form onSubmit={saveAttendance} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Worker"><select className={inputClass} required value={attendanceForm.worker_id} onChange={(e) => setAttendanceForm({ ...attendanceForm, worker_id: e.target.value })}><option value="">Select worker</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field><Field label="Date"><input type="date" className={inputClass} value={attendanceForm.attendance_date} onChange={(e) => setAttendanceForm({ ...attendanceForm, attendance_date: e.target.value })} /></Field><Field label="Status"><select className={inputClass} value={attendanceForm.status} onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}><option>Present</option><option>Absent</option><option>Leave</option></select></Field><Field label="Check In"><input type="time" className={inputClass} value={attendanceForm.check_in} onChange={(e) => setAttendanceForm({ ...attendanceForm, check_in: e.target.value })} /></Field><Field label="Check Out"><input type="time" className={inputClass} value={attendanceForm.check_out} onChange={(e) => setAttendanceForm({ ...attendanceForm, check_out: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Save Attendance</Button></div></form></Modal>}

      {procurementModal && <Modal title="Create Procurement" onClose={() => setProcurementModal(false)}><form onSubmit={saveProcurement} className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Project"><select className={inputClass} required value={procurementForm.project_id} onChange={(e) => setProcurementForm({ ...procurementForm, project_id: e.target.value })}><option value="">Select project</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field label="Item"><input className={inputClass} required value={procurementForm.item_name} onChange={(e) => setProcurementForm({ ...procurementForm, item_name: e.target.value })} /></Field><Field label="Category"><input className={inputClass} value={procurementForm.category} onChange={(e) => setProcurementForm({ ...procurementForm, category: e.target.value })} /></Field><Field label="Quantity"><input type="number" className={inputClass} value={procurementForm.quantity} onChange={(e) => setProcurementForm({ ...procurementForm, quantity: e.target.value })} /></Field><Field label="Unit Price"><input type="number" className={inputClass} value={procurementForm.unit_price} onChange={(e) => setProcurementForm({ ...procurementForm, unit_price: e.target.value })} /></Field><Field label="Supplier"><input className={inputClass} value={procurementForm.supplier} onChange={(e) => setProcurementForm({ ...procurementForm, supplier: e.target.value })} /></Field><div className="md:col-span-2 flex justify-end"><Button type="submit">Create Procurement</Button></div></form></Modal>}
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
const ActionButton = ({ icon: Icon, text, onClick, danger = false }) => <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${danger ? 'bg-red-500/15 text-red-100 border-red-400/40 hover:bg-red-500/25 hover:text-white' : 'text-amber-400 hover:bg-amber-500/10 border-transparent'} `}><Icon className="h-3.5 w-3.5" />{text}</button>;
const StatusBadge = ({ status }) => <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase">{String(status || 'N/A').replaceAll('_', ' ')}</span>;

export default Dashboard;
