import React, { useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  FolderKanban,
  FolderOpen,
  Layers,
  LogOut,
  Plus,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  Truck,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

const PROJECT_CATEGORIES = ['Commercial', 'Residential', 'Infrastructure', 'Industrial'];
const RESOURCE_CATEGORIES = ['CRANES', 'EXCAVATORS', 'CONCRETE_MIXERS', 'DUMP_TRUCKS', 'GENERATORS', 'SAFETY_EQUIPMENT'];
const RESOURCE_STATUSES = ['AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE'];
const MATERIAL_CATEGORIES = ['CEMENT', 'STEEL', 'BRICKS', 'SAND', 'CONCRETE', 'ELECTRICAL_MATERIALS'];

export const Dashboard = ({ currentUser, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notice, setNotice] = useState('');

  // 1. Projects
  const [projects, setProjects] = useState([
    {
      id: 101,
      name: 'Skyline Commercial Tower - Phase 2',
      description: '34-Story High-Rise Commercial Hub with LEED Platinum Certification',
      category: 'Commercial',
      location: 'Sector 44, Metro Downtown',
      budget: 4500000,
      status: 'in_progress',
    },
    {
      id: 102,
      name: 'Metro Elevated Viaduct Package-B',
      description: '14.2 km Dual-Track Pre-cast Box Girder Segment & 6 Stations',
      category: 'Infrastructure',
      location: 'Outer Ring Corridor',
      budget: 8200000,
      status: 'in_progress',
    },
    {
      id: 103,
      name: 'Harbor Logistics Warehouse Terminal',
      description: 'Heavy Industrial Automated Storage & Cold-Chain Facility',
      category: 'Industrial',
      location: 'Port Economic Zone',
      budget: 2800000,
      status: 'planning',
    },
  ]);

  // 2. Timeline Phases (No "Milestone" naming!)
  const [phases, setPhases] = useState([
    { id: 1, name: 'Basement Excavation & Piling Foundation', description: 'Securing bored cast-in-situ piles and diaphragm retaining walls', completion_pct: 100, status: 'Completed', due_date: '2026-04-15' },
    { id: 2, name: 'Podium & Structural RCC Framing (Floors 1-12)', description: 'Post-tensioned slab casting and shear wall reinforcement', completion_pct: 68, status: 'In Progress', due_date: '2026-10-30' },
    { id: 3, name: 'Viaduct Pier Cap Casting & Gantry Launching', description: 'Erection of precast concrete segmental spans over intersection', completion_pct: 45, status: 'In Progress', due_date: '2026-11-15' },
    { id: 4, name: 'Pre-Engineered Building (PEB) Steel Rafter Assembly', description: 'High-tensile steel truss erection and insulation cladding', completion_pct: 20, status: 'Pending', due_date: '2026-12-05' },
  ]);

  // 3. Machinery
  const [resources, setResources] = useState([
    { id: 301, name: 'Liebherr 280 EC-H 12 Litronic Tower Crane', category: 'CRANES', project_id: '101', quantity: 2, utilization_percentage: 88, status: 'IN_USE', maintenance_date: '2026-10-05' },
    { id: 302, name: 'CAT 320 Hydraulic Excavator (Heavy Duty)', category: 'EXCAVATORS', project_id: '102', quantity: 4, utilization_percentage: 75, status: 'IN_USE', maintenance_date: '2026-09-28' },
    { id: 303, name: 'Schwing Stetter Concrete Transit Mixer (8m³)', category: 'CONCRETE_MIXERS', project_id: '101', quantity: 6, utilization_percentage: 92, status: 'IN_USE', maintenance_date: '2026-10-12' },
    { id: 304, name: 'Cummins 500 kVA Mobile Silent Generator', category: 'GENERATORS', project_id: '103', quantity: 3, utilization_percentage: 30, status: 'AVAILABLE', maintenance_date: '2026-11-01' },
  ]);

  // 4. Materials
  const [inventory, setInventory] = useState([
    { id: 401, material_name: 'Ultratech OPC 53 Grade Cement', category: 'CEMENT', quantity: 2400, minimum_stock: 500, unit: 'Bags (50kg)', supplier: 'Ultratech Building Supplies Ltd' },
    { id: 402, material_name: 'Tata Tiscon Fe 550D TMT Rebar (16mm)', category: 'STEEL', quantity: 48, minimum_stock: 15, unit: 'Tons', supplier: 'Tata Steel Infrastructure' },
    { id: 403, material_name: 'Ready-Mix Concrete Grade M40', category: 'CONCRETE', quantity: 120, minimum_stock: 150, unit: 'm³', supplier: 'ACC ReadyMix Logistics' },
    { id: 404, material_name: 'High-Density AAC Blocks', category: 'BRICKS', quantity: 8500, minimum_stock: 2000, unit: 'Blocks', supplier: 'EcoBuild Masonry Corp' },
  ]);

  // 5. Documents Vault
  const [documents, setDocuments] = useState([
    { id: 1, title: 'Purchase Order Summary', category: 'Procurement', owner: 'Procurement Lead', status: 'Approved', revision: 'v2.1', updated: '2026-09-18', fileType: 'PDF' },
    { id: 2, title: 'Vendor Evaluation Sheet', category: 'Procurement', owner: 'Admin', status: 'Review', revision: 'v1.8', updated: '2026-09-17', fileType: 'XLSX' },
    { id: 3, title: 'Site Notification Log', category: 'Notifications', owner: 'Project Manager', status: 'Sent', revision: 'v3.0', updated: '2026-09-19', fileType: 'DOCX' },
    { id: 4, title: 'Safety Alert Memo', category: 'Notifications', owner: 'Site Engineer', status: 'Pending', revision: 'v1.2', updated: '2026-09-15', fileType: 'PDF' },
    { id: 5, title: 'Weekly Procurement Report', category: 'Reports', owner: 'Finance', status: 'Published', revision: 'v4.4', updated: '2026-09-20', fileType: 'PDF' },
    { id: 6, title: 'Stakeholder Update Report', category: 'Reports', owner: 'PMO', status: 'Draft', revision: 'v2.3', updated: '2026-09-16', fileType: 'DOCX' },
  ]);

  // Modals Open State
  const [openProjectModal, setOpenProjectModal] = useState(false);
  const [openAssetModal, setOpenAssetModal] = useState(false);
  const [openMaterialModal, setOpenMaterialModal] = useState(false);

  // Form State
  const [projectForm, setProjectForm] = useState({ name: '', category: 'Commercial', budget: '', description: '', location: '' });
  const [assetForm, setAssetForm] = useState({ name: '', category: 'CRANES', project_id: '101', quantity: 1, utilization_percentage: 60, status: 'AVAILABLE', maintenance_date: '2026-10-20' });
  const [materialForm, setMaterialForm] = useState({ material_name: '', category: 'CEMENT', quantity: 500, minimum_stock: 100, unit: 'Bags', supplier: '' });
  const [docCategory, setDocCategory] = useState('Procurement');
  const [docOwner, setDocOwner] = useState('');
  const [docFile, setDocFile] = useState(null);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const totalProgress = useMemo(() => {
    if (!phases.length) return 0;
    return Math.round(phases.reduce((acc, p) => acc + Number(p.completion_pct || 0), 0) / phases.length);
  }, [phases]);

  const totalBudget = useMemo(() => projects.reduce((acc, p) => acc + Number(p.budget || 0), 0), [projects]);

  // ADD FUNCTIONS
  const handleAddProject = (e) => {
    e.preventDefault();
    setProjects([...projects, { ...projectForm, id: Date.now(), status: 'in_progress' }]);
    setProjectForm({ name: '', category: 'Commercial', budget: '', description: '', location: '' });
    setOpenProjectModal(false);
    showNotice('Project created successfully!');
  };

  const handleAddAsset = (e) => {
    e.preventDefault();
    setResources([...resources, { ...assetForm, id: Date.now() }]);
    setAssetForm({ name: '', category: 'CRANES', project_id: '101', quantity: 1, utilization_percentage: 60, status: 'AVAILABLE', maintenance_date: '2026-10-20' });
    setOpenAssetModal(false);
    showNotice('Machinery asset added successfully!');
  };

  const handleAddMaterial = (e) => {
    e.preventDefault();
    setInventory([...inventory, { ...materialForm, id: Date.now() }]);
    setMaterialForm({ material_name: '', category: 'CEMENT', quantity: 500, minimum_stock: 100, unit: 'Bags', supplier: '' });
    setOpenMaterialModal(false);
    showNotice('Material stock item added!');
  };

  const handleUploadDoc = (e) => {
    e.preventDefault();
    if (!docFile) return;
    const newDoc = {
      id: Date.now(),
      title: docFile.name,
      category: docCategory,
      owner: docOwner || 'Rohitha Mamidisetti',
      status: 'Approved',
      revision: 'v1.0',
      fileType: docFile.name.split('.').pop()?.toUpperCase() || 'PDF',
      updated: new Date().toISOString().slice(0, 10),
    };
    setDocuments([newDoc, ...documents]);
    setDocFile(null);
    e.target.reset();
    showNotice('Document uploaded to Vault!');
  };

  // DELETE FUNCTIONS
  const deleteProject = (id) => {
    setProjects(projects.filter((p) => p.id !== id));
    showNotice('Project deleted.');
  };

  const deleteAsset = (id) => {
    setResources(resources.filter((r) => r.id !== id));
    showNotice('Machinery asset removed.');
  };

  const deleteMaterial = (id) => {
    setInventory(inventory.filter((i) => i.id !== id));
    showNotice('Material deleted.');
  };

  const deleteDoc = (id) => {
    setDocuments(documents.filter((d) => d.id !== id));
    showNotice('Document removed.');
  };

  const updatePhase = (id, val) => {
    const pct = Number(val);
    setPhases(phases.map((p) => p.id === id ? { ...p, completion_pct: pct, status: pct === 100 ? 'Completed' : 'In Progress' } : p));
  };

  return (
    <div style={{ backgroundColor: '#090d16', color: '#ffffff' }} className="flex min-h-screen w-full font-sans">
      {/* SIDEBAR */}
      <aside style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="w-64 border-r p-4 hidden md:flex flex-col justify-between shrink-0">
        <div className="space-y-2">
          {/* Logo Header - Cleaned */}
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">BT</div>
            <div>
              <h1 className="text-base font-black text-white leading-none">BuildTrack</h1>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-1">Enterprise PM</p>
            </div>
          </div>

          <div className="space-y-1">
            {[
              { id: 'overview', icon: Activity, label: 'Overview' },
              { id: 'projects', icon: FolderKanban, label: `Projects (${projects.length})` },
              { id: 'phases', icon: SlidersHorizontal, label: `Timeline Progress (${phases.length})` },
              { id: 'resources', icon: Truck, label: `Machinery & Fleet (${resources.length})` },
              { id: 'inventory', icon: Layers, label: `Materials & Inventory (${inventory.length})` },
              { id: 'documents', icon: FolderOpen, label: `Documents Vault (${documents.length})` },
              { id: 'procurement', icon: ShoppingCart, label: 'Procurement Orders' },
              { id: 'profile', icon: UserCheck, label: 'Manager Profile' },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ backgroundColor: active ? '#f59e0b' : 'transparent', color: active ? '#0f172a' : '#94a3b8' }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Card */}
        <div style={{ backgroundColor: '#090d16', borderColor: '#1e293b' }} className="p-3.5 rounded-2xl border">
          <p className="text-[10px] text-slate-400 font-semibold">Active User</p>
          <p className="text-xs font-bold text-amber-400 truncate">{currentUser?.name || 'Rohitha Mamidisetti'}</p>
          <p className="text-[10px] text-slate-400">PROJECT MANAGER</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-white">Construction Operations Workspace</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time equipment tracking, supply chain stockpile, and progress verification</p>
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-amber-400" /> Sign Out
          </button>
        </div>

        {notice && <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">{notice}</div>}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="border p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Active Flagship Project</span>
                <h3 className="text-2xl font-black text-white mt-1">{projects[0]?.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Multi-site operations and equipment resource coordination</p>
              </div>
              <div className="flex gap-4">
                <div style={{ backgroundColor: '#090d16' }} className="px-5 py-3 rounded-2xl border border-slate-800 text-right">
                  <span className="text-[10px] text-slate-400 block">Portfolio Budget</span>
                  <span className="text-lg font-black text-white">${totalBudget.toLocaleString()}</span>
                </div>
                <div style={{ backgroundColor: '#090d16' }} className="px-5 py-3 rounded-2xl border border-slate-800 text-right">
                  <span className="text-[10px] text-amber-400 block">Overall Completion</span>
                  <span className="text-lg font-black text-amber-400">{totalProgress}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="p-5 rounded-2xl border">
                <div className="flex justify-between text-slate-400"><span className="text-xs font-semibold">Active Projects</span><FolderKanban className="h-4 w-4 text-amber-400" /></div>
                <p className="text-2xl font-black text-white mt-2">{projects.length}</p>
              </div>
              <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="p-5 rounded-2xl border">
                <div className="flex justify-between text-slate-400"><span className="text-xs font-semibold">Fleet Assets</span><Truck className="h-4 w-4 text-amber-400" /></div>
                <p className="text-2xl font-black text-white mt-2">{resources.length}</p>
                <p className="text-[10px] text-amber-400 mt-1">88% Utilization Rate</p>
              </div>
              <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="p-5 rounded-2xl border">
                <div className="flex justify-between text-slate-400"><span className="text-xs font-semibold">Material Reserves</span><Layers className="h-4 w-4 text-amber-400" /></div>
                <p className="text-2xl font-black text-white mt-2">{inventory.length}</p>
                <p className="text-[10px] text-emerald-400 mt-1">Supplies Verified</p>
              </div>
              <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="p-5 rounded-2xl border">
                <div className="flex justify-between text-slate-400"><span className="text-xs font-semibold">Verified Documents</span><FolderOpen className="h-4 w-4 text-amber-400" /></div>
                <p className="text-2xl font-black text-white mt-2">{documents.length}</p>
                <p className="text-[10px] text-slate-400 mt-1">Stored in Vault</p>
              </div>
            </div>

            {/* Overall Bar */}
            <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="p-6 rounded-3xl border">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-white">Overall Portfolio Progress</span>
                <span className="text-sm font-black text-amber-400">{totalProgress}%</span>
              </div>
              <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${totalProgress}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div><h3 className="text-xl font-black text-white">Project Management</h3><p className="text-xs text-slate-400">All registered capital infrastructure projects</p></div>
              <button onClick={() => setOpenProjectModal(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-4 w-4" /> Create Project
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <div key={p.id} style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="p-5 rounded-2xl border flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div><span className="text-[10px] text-amber-400 font-mono font-bold">Project #{p.id}</span><h4 className="text-base font-black text-white">{p.name}</h4></div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">{p.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{p.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-4">
                      <div><span className="text-[10px] text-slate-500 block">Category</span>{p.category}</div>
                      <div><span className="text-[10px] text-slate-500 block">Budget</span>${Number(p.budget).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                    <button onClick={() => deleteProject(p.id)} className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TIMELINE PROGRESS (NO MILESTONE TEXT) */}
        {activeTab === 'phases' && (
          <div className="space-y-4">
            <div><h3 className="text-xl font-black text-white">Project Progress & Timeline</h3><p className="text-xs text-slate-400">Drag sliders to update phase completion percentage</p></div>
            <div className="space-y-3">
              {phases.map((ph) => (
                <div key={ph.id} style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="p-5 rounded-2xl border">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400">Target Date: {ph.due_date}</span>
                      <h4 className="text-sm font-bold text-white">{ph.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{ph.description}</p>
                    </div>
                    <span className="text-lg font-black text-amber-400">{ph.completion_pct}%</span>
                  </div>
                  <div className="mt-3">
                    <input type="range" min="0" max="100" value={ph.completion_pct} onChange={(e) => updatePhase(ph.id, e.target.value)} className="w-full accent-amber-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>Planning (0%)</span>
                      <span className="text-amber-400 font-semibold">{ph.status}</span>
                      <span>Completed (100%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MACHINERY & FLEET */}
        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div><h3 className="text-xl font-black text-white">Heavy Machinery & Fleet</h3><p className="text-xs text-slate-400">Site deployment, operational status, and maintenance</p></div>
              <button onClick={() => setOpenAssetModal(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-4 w-4" /> Add Asset
              </button>
            </div>
            <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-left text-xs">
                <thead style={{ backgroundColor: '#090d16' }} className="text-slate-400">
                  <tr><th className="p-3.5">Asset Name</th><th className="p-3.5">Category</th><th className="p-3.5">Site</th><th className="p-3.5">Quantity</th><th className="p-3.5">Utilization</th><th className="p-3.5">Status</th><th className="p-3.5">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {resources.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-white">{r.name}</td>
                      <td className="p-3.5">{r.category}</td>
                      <td className="p-3.5">Project #{r.project_id}</td>
                      <td className="p-3.5">{r.quantity} Units</td>
                      <td className="p-3.5 text-amber-400 font-bold">{r.utilization_percentage}%</td>
                      <td className="p-3.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{r.status}</span></td>
                      <td className="p-3.5"><button onClick={() => deleteAsset(r.id)} className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /> Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MATERIALS & INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div><h3 className="text-xl font-black text-white">Materials & Stockpile</h3><p className="text-xs text-slate-400">Cement, rebar, and aggregate reserves</p></div>
              <button onClick={() => setOpenMaterialModal(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-4 w-4" /> Add Material
              </button>
            </div>
            <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-left text-xs">
                <thead style={{ backgroundColor: '#090d16' }} className="text-slate-400">
                  <tr><th className="p-3.5">Material</th><th className="p-3.5">Category</th><th className="p-3.5">Stock</th><th className="p-3.5">Reserve</th><th className="p-3.5">Supplier</th><th className="p-3.5">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {inventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-white">{item.material_name}</td>
                      <td className="p-3.5">{item.category}</td>
                      <td className="p-3.5 font-mono text-amber-400 font-bold">{item.quantity} {item.unit}</td>
                      <td className="p-3.5 font-mono text-slate-400">{item.minimum_stock} {item.unit}</td>
                      <td className="p-3.5">{item.supplier}</td>
                      <td className="p-3.5"><button onClick={() => deleteMaterial(item.id)} className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /> Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DOCUMENTS VAULT */}
        {activeTab === 'documents' && (
          <div className="space-y-5">
            <div><h3 className="text-xl font-black text-white">Documents Vault</h3><p className="text-xs text-slate-400">Centralized repository for drawings, purchase orders, and QA logs</p></div>

            {/* Upload Box */}
            <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="p-5 rounded-2xl border">
              <form onSubmit={handleUploadDoc} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Choose File</label>
                  <input type="file" required onChange={(e) => setDocFile(e.target.files?.[0] || null)} className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-amber-500 file:text-slate-950 file:font-bold cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white">
                    <option value="Procurement">Procurement</option>
                    <option value="Notifications">Notifications</option>
                    <option value="Reports">Reports</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="h-4 w-4" /> Upload Document
                </button>
              </form>
            </div>

            {/* Documents List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Procurement', 'Notifications', 'Reports'].map((grp) => {
                const list = documents.filter((d) => d.category === grp);
                return (
                  <div key={grp} style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="p-4 rounded-2xl border space-y-3">
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">{grp}</h4>
                    {list.map((doc) => (
                      <div key={doc.id} style={{ backgroundColor: '#090d16', borderColor: '#1e293b' }} className="p-3 rounded-xl border">
                        <div className="flex justify-between items-start">
                          <div><p className="text-xs font-bold text-white">{doc.title}</p><p className="text-[10px] text-slate-400">{doc.owner} • {doc.fileType}</p></div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">{doc.status}</span>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                          <span className="text-slate-500">{doc.updated}</span>
                          <button onClick={() => deleteDoc(doc.id)} className="text-rose-400 font-bold hover:underline cursor-pointer">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PROCUREMENT */}
        {activeTab === 'procurement' && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white">Procurement Orders</h3>
            <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="p-5 rounded-2xl border flex justify-between items-center">
              <div><span className="text-[10px] text-amber-400 font-mono">PO #501 • RAW_MATERIALS</span><h4 className="font-bold text-white text-sm">Structural Grade Cement (OPC 53)</h4><p className="text-xs text-slate-400">Qty: 2500 Bags • Supplier: Ultratech Supplies</p></div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">APPROVED</span>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white">Manager Profile</h3>
            <div style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} className="p-6 rounded-2xl border space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-2xl">R</div>
                <div><h4 className="text-lg font-black text-white">{currentUser?.name || 'Rohitha Mamidisetti'}</h4><p className="text-sm text-slate-400">rohitha@buildtrack.com</p></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
                <div><span className="text-[10px] text-slate-500 block">Role</span>Project Manager</div>
                <div><span className="text-[10px] text-slate-500 block">Phone</span>+91 98450 77123</div>
                <div><span className="text-[10px] text-slate-500 block">Status</span>Active (Verified)</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE PROJECT MODAL */}
      {openProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div style={{ backgroundColor: '#0f172a' }} className="w-full max-w-md p-6 rounded-2xl border border-slate-700 space-y-4">
            <div className="flex justify-between items-center"><h4 className="font-bold text-white">Create New Project</h4><button onClick={() => setOpenProjectModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button></div>
            <form onSubmit={handleAddProject} className="space-y-3">
              <input required placeholder="Project Name" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white" />
              <select value={projectForm.category} onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white">{PROJECT_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
              <input type="number" required placeholder="Budget ($)" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white" />
              <input placeholder="Location" value={projectForm.location} onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white" />
              <div className="flex justify-end pt-2"><button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer">Create</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ASSET MODAL */}
      {openAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div style={{ backgroundColor: '#0f172a' }} className="w-full max-w-md p-6 rounded-2xl border border-slate-700 space-y-4">
            <div className="flex justify-between items-center"><h4 className="font-bold text-white">Add Machinery Asset</h4><button onClick={() => setOpenAssetModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button></div>
            <form onSubmit={handleAddAsset} className="space-y-3">
              <input required placeholder="Asset / Machine Name" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white" />
              <select value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white">{RESOURCE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
              <input type="number" min="1" required placeholder="Quantity" value={assetForm.quantity} onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white" />
              <input type="number" min="0" max="100" placeholder="Utilization %" value={assetForm.utilization_percentage} onChange={(e) => setAssetForm({ ...assetForm, utilization_percentage: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white" />
              <div className="flex justify-end pt-2"><button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer">Add Asset</button></div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MATERIAL MODAL */}
      {openMaterialModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div style={{ backgroundColor: '#0f172a' }} className="w-full max-w-md p-6 rounded-2xl border border-slate-700 space-y-4">
            <div className="flex justify-between items-center"><h4 className="font-bold text-white">Add Material Stock</h4><button onClick={() => setOpenMaterialModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button></div>
            <form onSubmit={handleAddMaterial} className="space-y-3">
              <input required placeholder="Material Name" value={materialForm.material_name} onChange={(e) => setMaterialForm({ ...materialForm, material_name: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white" />
              <select value={materialForm.category} onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white">{MATERIAL_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
              <input type="number" required placeholder="Stock Quantity" value={materialForm.quantity} onChange={(e) => setMaterialForm({ ...materialForm, quantity: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white" />
              <input placeholder="Unit of Measure (Bags, Tons, m³)" value={materialForm.unit} onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white" />
              <input placeholder="Supplier" value={materialForm.supplier} onChange={(e) => setMaterialForm({ ...materialForm, supplier: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white" />
              <div className="flex justify-end pt-2"><button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer">Add Material</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
