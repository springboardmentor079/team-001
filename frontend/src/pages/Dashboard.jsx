import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  CalendarCheck,
  CheckCircle2,
  Download,
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

const PROJECT_CATEGORIES = [
  'Commercial',
  'Residential',
  'Infrastructure',
  'Industrial',
];

const RESOURCE_CATEGORIES = [
  'CRANES',
  'EXCAVATORS',
  'CONCRETE_MIXERS',
  'DUMP_TRUCKS',
  'GENERATORS',
  'SAFETY_EQUIPMENT',
];

const MATERIAL_CATEGORIES = [
  'CEMENT',
  'STEEL',
  'BRICKS',
  'SAND',
  'CONCRETE',
  'ELECTRICAL_MATERIALS',
];

export const Dashboard = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notice, setNotice] = useState('');

  const [projects, setProjects] = useState([
    {
      id: 101,
      name: 'Skyline Commercial Tower',
      category: 'Commercial',
      location: 'Sector 44',
      budget: 4500000,
      status: 'In Progress',
    },
    {
      id: 102,
      name: 'Metro Elevated Viaduct',
      category: 'Infrastructure',
      location: 'Outer Ring Corridor',
      budget: 8200000,
      status: 'In Progress',
    },
    {
      id: 103,
      name: 'Harbor Logistics Warehouse',
      category: 'Industrial',
      location: 'Port Economic Zone',
      budget: 2800000,
      status: 'Planning',
    },
  ]);

  const [phases, setPhases] = useState([
    {
      id: 1,
      name: 'Foundation Work',
      description: 'Excavation and piling foundation',
      completion_pct: 100,
      status: 'Completed',
      due_date: '2026-04-15',
    },
    {
      id: 2,
      name: 'Structural Work',
      description: 'RCC framing and slab construction',
      completion_pct: 68,
      status: 'In Progress',
      due_date: '2026-10-30',
    },
    {
      id: 3,
      name: 'Viaduct Construction',
      description: 'Pier and segment construction',
      completion_pct: 45,
      status: 'In Progress',
      due_date: '2026-11-15',
    },
    {
      id: 4,
      name: 'Steel Assembly',
      description: 'Steel structure and roofing',
      completion_pct: 20,
      status: 'Pending',
      due_date: '2026-12-05',
    },
  ]);

  const [resources, setResources] = useState([
    {
      id: 301,
      name: 'Tower Crane',
      category: 'CRANES',
      project_id: '101',
      quantity: 2,
      utilization_percentage: 88,
      status: 'IN_USE',
    },
    {
      id: 302,
      name: 'Hydraulic Excavator',
      category: 'EXCAVATORS',
      project_id: '102',
      quantity: 4,
      utilization_percentage: 75,
      status: 'IN_USE',
    },
    {
      id: 303,
      name: 'Concrete Mixer',
      category: 'CONCRETE_MIXERS',
      project_id: '101',
      quantity: 6,
      utilization_percentage: 92,
      status: 'IN_USE',
    },
    {
      id: 304,
      name: 'Mobile Generator',
      category: 'GENERATORS',
      project_id: '103',
      quantity: 3,
      utilization_percentage: 30,
      status: 'AVAILABLE',
    },
  ]);

  const [inventory, setInventory] = useState([
    {
      id: 401,
      material_name: 'OPC 53 Cement',
      category: 'CEMENT',
      quantity: 2400,
      minimum_stock: 500,
      unit: 'Bags',
      supplier: 'Ultratech',
    },
    {
      id: 402,
      material_name: 'TMT Steel',
      category: 'STEEL',
      quantity: 48,
      minimum_stock: 15,
      unit: 'Tons',
      supplier: 'Tata Steel',
    },
    {
      id: 403,
      material_name: 'M40 Concrete',
      category: 'CONCRETE',
      quantity: 120,
      minimum_stock: 150,
      unit: 'm³',
      supplier: 'ACC ReadyMix',
    },
    {
      id: 404,
      material_name: 'AAC Blocks',
      category: 'BRICKS',
      quantity: 8500,
      minimum_stock: 2000,
      unit: 'Blocks',
      supplier: 'EcoBuild',
    },
  ]);

  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: 'Ravi Kumar',
      role: 'Site Engineer',
      date: '2026-09-25',
      status: 'Present',
    },
    {
      id: 2,
      name: 'Anil Kumar',
      role: 'Supervisor',
      date: '2026-09-25',
      status: 'Present',
    },
    {
      id: 3,
      name: 'Priya Sharma',
      role: 'Safety Officer',
      date: '2026-09-25',
      status: 'Absent',
    },
    {
      id: 4,
      name: 'Suresh Reddy',
      role: 'Worker',
      date: '2026-09-25',
      status: 'Present',
    },
    {
      id: 5,
      name: 'Kiran',
      role: 'Worker',
      date: '2026-09-25',
      status: 'Leave',
    },
  ]);

  const [orders, setOrders] = useState([
    {
      id: 501,
      item: 'Structural Grade Cement',
      quantity: '2500 Bags',
      supplier: 'Ultratech Supplies',
      amount: 250000,
      status: 'Approved',
    },
    {
      id: 502,
      item: 'TMT Steel Rebars',
      quantity: '20 Tons',
      supplier: 'Tata Steel',
      amount: 1200000,
      status: 'Pending',
    },
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Safety Inspection',
      message: 'Site safety inspection is scheduled for tomorrow.',
      type: 'Safety',
      read: false,
    },
    {
      id: 2,
      title: 'Material Alert',
      message: 'Concrete stock is below minimum level.',
      type: 'Inventory',
      read: false,
    },
    {
      id: 3,
      title: 'Project Update',
      message: 'Structural work progress has been updated.',
      type: 'Project',
      read: true,
    },
  ]);

  const [documents, setDocuments] = useState([
    {
      id: 1,
      title: 'Purchase Order Summary',
      category: 'Procurement',
      owner: 'Procurement Lead',
      status: 'Approved',
      type: 'PDF',
      date: '2026-09-20',
    },
    {
      id: 2,
      title: 'Attendance Report',
      category: 'Reports',
      owner: 'Admin',
      status: 'Published',
      type: 'PDF',
      date: '2026-09-25',
    },
    {
      id: 3,
      title: 'Safety Alert Memo',
      category: 'Notifications',
      owner: 'Site Engineer',
      status: 'Sent',
      type: 'DOCX',
      date: '2026-09-24',
    },
  ]);

  const [openProjectModal, setOpenProjectModal] = useState(false);
  const [openAssetModal, setOpenAssetModal] = useState(false);
  const [openMaterialModal, setOpenMaterialModal] = useState(false);
  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [openNotificationModal, setOpenNotificationModal] = useState(false);

  const [projectForm, setProjectForm] = useState({
    name: '',
    category: 'Commercial',
    location: '',
    budget: '',
  });

  const [assetForm, setAssetForm] = useState({
    name: '',
    category: 'CRANES',
    quantity: 1,
    utilization_percentage: 50,
    status: 'AVAILABLE',
  });

  const [materialForm, setMaterialForm] = useState({
    material_name: '',
    category: 'CEMENT',
    quantity: 500,
    minimum_stock: 100,
    unit: 'Bags',
    supplier: '',
  });

  const [orderForm, setOrderForm] = useState({
    item: '',
    quantity: '',
    supplier: '',
    amount: '',
  });

  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'General',
  });

  const [docFile, setDocFile] = useState(null);

  const showNotice = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 2500);
  };

  const totalProgress = useMemo(() => {
    if (!phases.length) return 0;

    return Math.round(
      phases.reduce(
        (sum, phase) => sum + Number(phase.completion_pct),
        0
      ) / phases.length
    );
  }, [phases]);

  const totalBudget = useMemo(
    () =>
      projects.reduce(
        (sum, project) => sum + Number(project.budget || 0),
        0
      ),
    [projects]
  );

  const presentCount = employees.filter(
    (e) => e.status === 'Present'
  ).length;

  const absentCount = employees.filter(
    (e) => e.status === 'Absent'
  ).length;

  const leaveCount = employees.filter(
    (e) => e.status === 'Leave'
  ).length;

  const attendanceRate = Math.round(
    (presentCount / employees.length) * 100
  );

  const averageUtilization = Math.round(
    resources.reduce(
      (sum, r) => sum + Number(r.utilization_percentage),
      0
    ) / resources.length
  );

  const updateAttendance = (id, status) => {
    setEmployees(
      employees.map((employee) =>
        employee.id === id
          ? { ...employee, status }
          : employee
      )
    );

    showNotice('Attendance updated successfully.');
  };

  const updatePhase = (id, value) => {
    const percentage = Number(value);

    setPhases(
      phases.map((phase) =>
        phase.id === id
          ? {
              ...phase,
              completion_pct: percentage,
              status:
                percentage === 100
                  ? 'Completed'
                  : percentage === 0
                  ? 'Pending'
                  : 'In Progress',
            }
          : phase
      )
    );
  };

  const addProject = (e) => {
    e.preventDefault();

    setProjects([
      ...projects,
      {
        id: Date.now(),
        ...projectForm,
        budget: Number(projectForm.budget),
        status: 'Planning',
      },
    ]);

    setProjectForm({
      name: '',
      category: 'Commercial',
      location: '',
      budget: '',
    });

    setOpenProjectModal(false);
    showNotice('Project added successfully.');
  };

  const addAsset = (e) => {
    e.preventDefault();

    setResources([
      ...resources,
      {
        id: Date.now(),
        ...assetForm,
      },
    ]);

    setAssetForm({
      name: '',
      category: 'CRANES',
      quantity: 1,
      utilization_percentage: 50,
      status: 'AVAILABLE',
    });

    setOpenAssetModal(false);
    showNotice('Machinery added successfully.');
  };

  const addMaterial = (e) => {
    e.preventDefault();

    setInventory([
      ...inventory,
      {
        id: Date.now(),
        ...materialForm,
      },
    ]);

    setMaterialForm({
      material_name: '',
      category: 'CEMENT',
      quantity: 500,
      minimum_stock: 100,
      unit: 'Bags',
      supplier: '',
    });

    setOpenMaterialModal(false);
    showNotice('Material added successfully.');
  };

  const addOrder = (e) => {
    e.preventDefault();

    setOrders([
      ...orders,
      {
        id: Date.now(),
        item: orderForm.item,
        quantity: orderForm.quantity,
        supplier: orderForm.supplier,
        amount: Number(orderForm.amount),
        status: 'Pending',
      },
    ]);

    setOrderForm({
      item: '',
      quantity: '',
      supplier: '',
      amount: '',
    });

    setOpenOrderModal(false);
    showNotice('Procurement order created.');
  };

  const addNotification = (e) => {
    e.preventDefault();

    setNotifications([
      {
        id: Date.now(),
        ...notificationForm,
        read: false,
      },
      ...notifications,
    ]);

    setNotificationForm({
      title: '',
      message: '',
      type: 'General',
    });

    setOpenNotificationModal(false);
    showNotice('Notification created.');
  };

  const uploadDocument = (e) => {
    e.preventDefault();

    if (!docFile) {
      showNotice('Please select a file.');
      return;
    }

    setDocuments([
      {
        id: Date.now(),
        title: docFile.name,
        category: 'Reports',
        owner: currentUser?.name || 'Manager',
        status: 'Uploaded',
        type:
          docFile.name.split('.').pop()?.toUpperCase() ||
          'FILE',
        date: new Date().toISOString().slice(0, 10),
      },
      ...documents,
    ]);

    setDocFile(null);
    e.target.reset();

    showNotice('Document uploaded successfully.');
  };

  const deleteProject = (id) => {
    setProjects(projects.filter((p) => p.id !== id));
    showNotice('Project deleted.');
  };

  const deleteAsset = (id) => {
    setResources(resources.filter((r) => r.id !== id));
    showNotice('Machinery deleted.');
  };

  const deleteMaterial = (id) => {
    setInventory(inventory.filter((m) => m.id !== id));
    showNotice('Material deleted.');
  };

  const deleteOrder = (id) => {
    setOrders(orders.filter((o) => o.id !== id));
    showNotice('Order deleted.');
  };

  const deleteNotification = (id) => {
    setNotifications(
      notifications.filter((n) => n.id !== id)
    );
    showNotice('Notification deleted.');
  };

  const deleteDocument = (id) => {
    setDocuments(
      documents.filter((d) => d.id !== id)
    );
    showNotice('Document deleted.');
  };

  const markNotificationRead = (id) => {
    setNotifications(
      notifications.map((n) =>
        n.id === id
          ? { ...n, read: true }
          : n
      )
    );
  };

  const navItems = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: Activity,
    },
    {
      id: 'projects',
      label: `Projects (${projects.length})`,
      icon: FolderKanban,
    },
    {
      id: 'attendance',
      label: 'Attendance Management',
      icon: CalendarCheck,
    },
    {
      id: 'phases',
      label: 'Timeline Progress',
      icon: SlidersHorizontal,
    },
    {
      id: 'resources',
      label: 'Machinery & Fleet',
      icon: Truck,
    },
    {
      id: 'inventory',
      label: 'Materials & Inventory',
      icon: Layers,
    },
    {
      id: 'procurement',
      label: 'Procurement Orders',
      icon: ShoppingCart,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'documents',
      label: 'Document Management',
      icon: FolderOpen,
    },
    {
      id: 'profile',
      label: 'Manager Profile',
      icon: UserCheck,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#fcfcfb] text-black flex font-sans">

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-72 shrink-0 bg-white border-r border-gray-200 p-4 flex-col justify-between">

        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-yellow-400 flex items-center justify-center text-xl">
              🏗️
            </div>

            <div>
              <h1 className="text-lg font-black">
                BuildTrack
              </h1>

              <p className="text-[10px] text-gray-500">
                Construction PM
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() =>
                    setActiveTab(item.id)
                  }
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-bold transition ${
                    activeTab === item.id
                      ? 'bg-yellow-400 text-black'
                      : 'text-gray-600 hover:bg-yellow-50 hover:text-black'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-[10px] text-gray-500">
            Logged in as
          </p>

          <p className="font-black text-sm">
            {currentUser?.name ||
              'Rohitha Mamidisetti'}
          </p>

          <p className="text-[10px] text-yellow-700 font-bold">
            PROJECT MANAGER
          </p>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">

        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">

          <div>
            <h2 className="text-xl font-black">
              BuildTrack
            </h2>

            <p className="text-xs text-gray-500">
              Project management, attendance, procurement,
              reports and analytics
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-black">
                {currentUser?.name ||
                  'Rohitha Mamidisetti'}
              </p>

              <span className="text-[10px] bg-yellow-100 px-2 py-1 rounded font-bold">
                PROJECT_MANAGER
              </span>
            </div>

            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-8">

          {notice && (
            <div className="mb-5 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-bold">
              {notice}
            </div>
          )}

          {/* DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              <div>
                <h2 className="text-2xl font-black">
                  Dashboard
                </h2>

                <p className="text-sm text-gray-500">
                  Construction operations overview
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold">
                    Total Projects
                  </p>

                  <p className="text-3xl font-black mt-2">
                    {projects.length}
                  </p>
                </div>

                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold">
                    Attendance
                  </p>

                  <p className="text-3xl font-black mt-2">
                    {attendanceRate}%
                  </p>
                </div>

                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold">
                    Machine Utilization
                  </p>

                  <p className="text-3xl font-black mt-2">
                    {averageUtilization}%
                  </p>
                </div>

                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold">
                    Procurement Orders
                  </p>

                  <p className="text-3xl font-black mt-2">
                    {orders.length}
                  </p>
                </div>

              </div>

              <div className="bg-white border rounded-2xl p-6 shadow-sm">

                <div className="flex justify-between mb-2">
                  <span className="font-black">
                    Overall Project Progress
                  </span>

                  <span className="font-black text-yellow-700">
                    {totalProgress}%
                  </span>
                </div>

                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{
                      width: `${totalProgress}%`,
                    }}
                  />
                </div>

              </div>

              <div className="bg-white border rounded-2xl p-6 shadow-sm">

                <h3 className="font-black mb-4">
                  Quick Summary
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                  <button
                    onClick={() =>
                      setActiveTab('attendance')
                    }
                    className="border rounded-xl p-4 hover:bg-yellow-50 text-left"
                  >
                    <Users className="w-5 h-5 mb-2" />
                    <p className="font-bold">
                      Attendance
                    </p>
                    <p className="text-xs text-gray-500">
                      {presentCount} Present
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      setActiveTab('procurement')
                    }
                    className="border rounded-xl p-4 hover:bg-yellow-50 text-left"
                  >
                    <ShoppingCart className="w-5 h-5 mb-2" />
                    <p className="font-bold">
                      Procurement
                    </p>
                    <p className="text-xs text-gray-500">
                      {orders.length} Orders
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      setActiveTab('reports')
                    }
                    className="border rounded-xl p-4 hover:bg-yellow-50 text-left"
                  >
                    <FileText className="w-5 h-5 mb-2" />
                    <p className="font-bold">
                      Reports
                    </p>
                    <p className="text-xs text-gray-500">
                      View Reports
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      setActiveTab('analytics')
                    }
                    className="border rounded-xl p-4 hover:bg-yellow-50 text-left"
                  >
                    <BarChart3 className="w-5 h-5 mb-2" />
                    <p className="font-bold">
                      Analytics
                    </p>
                    <p className="text-xs text-gray-500">
                      View Analytics
                    </p>
                  </button>

                </div>
              </div>

            </div>
          )}

          {/* PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-5">

              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black">
                    Projects
                  </h2>
                  <p className="text-sm text-gray-500">
                    Manage construction projects
                  </p>
                </div>

                <button
                  onClick={() =>
                    setOpenProjectModal(true)
                  }
                  className="bg-yellow-400 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Project
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">

                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white border rounded-2xl p-5 shadow-sm"
                  >

                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs text-yellow-700 font-bold">
                          Project #{project.id}
                        </p>

                        <h3 className="font-black">
                          {project.name}
                        </h3>
                      </div>

                      <span className="bg-yellow-100 px-2 py-1 rounded text-[10px] font-bold">
                        {project.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">
                          Category
                        </p>
                        {project.category}
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">
                          Location
                        </p>
                        {project.location}
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">
                          Budget
                        </p>
                        ₹{Number(project.budget).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        deleteProject(project.id)
                      }
                      className="mt-5 text-red-600 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>

                  </div>
                ))}

              </div>
            </div>
          )}

          {/* ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-5">

              <div>
                <h2 className="text-2xl font-black">
                  Attendance Management
                </h2>

                <p className="text-sm text-gray-500">
                  Track daily employee and worker attendance
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-xs text-gray-500">
                    Total Staff
                  </p>
                  <p className="text-3xl font-black">
                    {employees.length}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <p className="text-xs text-green-700">
                    Present
                  </p>
                  <p className="text-3xl font-black text-green-700">
                    {presentCount}
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <p className="text-xs text-red-700">
                    Absent
                  </p>
                  <p className="text-3xl font-black text-red-700">
                    {absentCount}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                  <p className="text-xs text-yellow-700">
                    Leave
                  </p>
                  <p className="text-3xl font-black text-yellow-700">
                    {leaveCount}
                  </p>
                </div>

              </div>

              <div className="bg-white border rounded-2xl overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 text-left">
                        Employee
                      </th>
                      <th className="p-4 text-left">
                        Role
                      </th>
                      <th className="p-4 text-left">
                        Date
                      </th>
                      <th className="p-4 text-left">
                        Status
                      </th>
                      <th className="p-4 text-left">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {employees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="border-b"
                      >

                        <td className="p-4 font-bold">
                          {employee.name}
                        </td>

                        <td className="p-4">
                          {employee.role}
                        </td>

                        <td className="p-4">
                          {employee.date}
                        </td>

                        <td className="p-4">

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              employee.status ===
                              'Present'
                                ? 'bg-green-100 text-green-700'
                                : employee.status ===
                                  'Absent'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {employee.status}
                          </span>

                        </td>

                        <td className="p-4">

                          <div className="flex gap-2">

                            <button
                              onClick={() =>
                                updateAttendance(
                                  employee.id,
                                  'Present'
                                )
                              }
                              className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold"
                            >
                              Present
                            </button>

                            <button
                              onClick={() =>
                                updateAttendance(
                                  employee.id,
                                  'Absent'
                                )
                              }
                              className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold"
                            >
                              Absent
                            </button>

                            <button
                              onClick={() =>
                                updateAttendance(
                                  employee.id,
                                  'Leave'
                                )
                              }
                              className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-xs font-bold"
                            >
                              Leave
                            </button>

                          </div>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            </div>
          )}

          {/* TIMELINE */}
          {activeTab === 'phases' && (
            <div className="space-y-5">

              <div>
                <h2 className="text-2xl font-black">
                  Timeline Progress
                </h2>

                <p className="text-sm text-gray-500">
                  Update project phase completion
                </p>
              </div>

              {phases.map((phase) => (
                <div
                  key={phase.id}
                  className="bg-white border rounded-2xl p-5"
                >

                  <div className="flex justify-between">

                    <div>
                      <h3 className="font-black">
                        {phase.name}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {phase.description}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        Due: {phase.due_date}
                      </p>
                    </div>

                    <span className="font-black text-yellow-700">
                      {phase.completion_pct}%
                    </span>

                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={phase.completion_pct}
                    onChange={(e) =>
                      updatePhase(
                        phase.id,
                        e.target.value
                      )
                    }
                    className="w-full mt-5 accent-yellow-400"
                  />

                  <p className="text-xs font-bold text-yellow-700">
                    {phase.status}
                  </p>

                </div>
              ))}

            </div>
          )}

          {/* MACHINERY */}
          {activeTab === 'resources' && (
            <div className="space-y-5">

              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black">
                    Machinery & Fleet
                  </h2>
                  <p className="text-sm text-gray-500">
                    Manage construction equipment
                  </p>
                </div>

                <button
                  onClick={() =>
                    setOpenAssetModal(true)
                  }
                  className="bg-yellow-400 px-4 py-2 rounded-xl font-black text-sm flex gap-2 items-center"
                >
                  <Plus className="w-4 h-4" />
                  Add Asset
                </button>
              </div>

              <div className="bg-white border rounded-2xl overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left">
                        Asset
                      </th>
                      <th className="p-4 text-left">
                        Category
                      </th>
                      <th className="p-4 text-left">
                        Quantity
                      </th>
                      <th className="p-4 text-left">
                        Utilization
                      </th>
                      <th className="p-4 text-left">
                        Status
                      </th>
                      <th className="p-4 text-left">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {resources.map((resource) => (
                      <tr
                        key={resource.id}
                        className="border-t"
                      >

                        <td className="p-4 font-bold">
                          {resource.name}
                        </td>

                        <td className="p-4">
                          {resource.category}
                        </td>

                        <td className="p-4">
                          {resource.quantity}
                        </td>

                        <td className="p-4 font-bold">
                          {resource.utilization_percentage}%
                        </td>

                        <td className="p-4">
                          {resource.status}
                        </td>

                        <td className="p-4">

                          <button
                            onClick={() =>
                              deleteAsset(resource.id)
                            }
                            className="text-red-600 font-bold text-xs"
                          >
                            Delete
                          </button>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </div>
          )}

          {/* MATERIALS */}
          {activeTab === 'inventory' && (
            <div className="space-y-5">

              <div className="flex justify-between items-center">

                <div>
                  <h2 className="text-2xl font-black">
                    Materials & Inventory
                  </h2>

                  <p className="text-sm text-gray-500">
                    Manage construction materials
                  </p>
                </div>

                <button
                  onClick={() =>
                    setOpenMaterialModal(true)
                  }
                  className="bg-yellow-400 px-4 py-2 rounded-xl font-black text-sm flex gap-2 items-center"
                >
                  <Plus className="w-4 h-4" />
                  Add Material
                </button>

              </div>

              <div className="bg-white border rounded-2xl overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left">
                        Material
                      </th>
                      <th className="p-4 text-left">
                        Category
                      </th>
                      <th className="p-4 text-left">
                        Stock
                      </th>
                      <th className="p-4 text-left">
                        Supplier
                      </th>
                      <th className="p-4 text-left">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {inventory.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t"
                      >

                        <td className="p-4 font-bold">
                          {item.material_name}
                        </td>

                        <td className="p-4">
                          {item.category}
                        </td>

                        <td className="p-4">
                          {item.quantity} {item.unit}
                        </td>

                        <td className="p-4">
                          {item.supplier}
                        </td>

                        <td className="p-4">

                          <button
                            onClick={() =>
                              deleteMaterial(item.id)
                            }
                            className="text-red-600 font-bold text-xs"
                          >
                            Delete
                          </button>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </div>
          )}

          {/* PROCUREMENT */}
          {activeTab === 'procurement' && (
            <div className="space-y-5">

              <div className="flex justify-between items-center">

                <div>
                  <h2 className="text-2xl font-black">
                    Procurement Orders
                  </h2>

                  <p className="text-sm text-gray-500">
                    Manage purchase orders and suppliers
                  </p>
                </div>

                <button
                  onClick={() =>
                    setOpenOrderModal(true)
                  }
                  className="bg-yellow-400 px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Order
                </button>

              </div>

              <div className="grid md:grid-cols-2 gap-4">

                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border rounded-2xl p-5"
                  >

                    <div className="flex justify-between">

                      <div>
                        <p className="text-xs text-yellow-700 font-bold">
                          PO #{order.id}
                        </p>

                        <h3 className="font-black mt-1">
                          {order.item}
                        </h3>
                      </div>

                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                        {order.status}
                      </span>

                    </div>

                    <div className="mt-4 space-y-2 text-sm">

                      <p>
                        <b>Quantity:</b> {order.quantity}
                      </p>

                      <p>
                        <b>Supplier:</b> {order.supplier}
                      </p>

                      <p>
                        <b>Amount:</b> ₹
                        {Number(
                          order.amount
                        ).toLocaleString()}
                      </p>

                    </div>

                    <button
                      onClick={() =>
                        deleteOrder(order.id)
                      }
                      className="mt-4 text-red-600 text-xs font-bold"
                    >
                      Delete Order
                    </button>

                  </div>
                ))}

              </div>

            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">

              <div className="flex justify-between items-center">

                <div>
                  <h2 className="text-2xl font-black">
                    Notifications
                  </h2>

                  <p className="text-sm text-gray-500">
                    Manage project notifications and alerts
                  </p>
                </div>

                <button
                  onClick={() =>
                    setOpenNotificationModal(true)
                  }
                  className="bg-yellow-400 px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Notification
                </button>

              </div>

              <div className="space-y-3">

                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-white border rounded-2xl p-5 ${
                      !notification.read
                        ? 'border-yellow-300'
                        : ''
                    }`}
                  >

                    <div className="flex justify-between gap-4">

                      <div>

                        <div className="flex gap-2 items-center">

                          <h3 className="font-black">
                            {notification.title}
                          </h3>

                          {!notification.read && (
                            <span className="text-[10px] bg-yellow-400 px-2 py-1 rounded-full font-bold">
                              NEW
                            </span>
                          )}

                        </div>

                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>

                        <p className="text-xs text-gray-400 mt-2">
                          Type: {notification.type}
                        </p>

                      </div>

                      <div className="flex gap-2 items-start">

                        {!notification.read && (
                          <button
                            onClick={() =>
                              markNotificationRead(
                                notification.id
                              )
                            }
                            className="text-green-600 text-xs font-bold"
                          >
                            Mark Read
                          </button>
                        )}

                        <button
                          onClick={() =>
                            deleteNotification(
                              notification.id
                            )
                          }
                          className="text-red-600 text-xs font-bold"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>
                ))}

              </div>

            </div>
          )}

          {/* REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-5">

              <div>
                <h2 className="text-2xl font-black">
                  Reports
                </h2>

                <p className="text-sm text-gray-500">
                  Project and operational reports
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">

                {[
                  [
                    'Attendance Report',
                    `${presentCount} present, ${absentCount} absent, ${leaveCount} on leave`,
                  ],
                  [
                    'Project Progress Report',
                    `Overall completion: ${totalProgress}%`,
                  ],
                  [
                    'Procurement Report',
                    `${orders.length} purchase orders available`,
                  ],
                  [
                    'Resource Report',
                    `Average machinery utilization: ${averageUtilization}%`,
                  ],
                ].map(([title, description]) => (

                  <div
                    key={title}
                    className="bg-white border rounded-2xl p-5"
                  >

                    <FileText className="w-7 h-7 text-yellow-600" />

                    <h3 className="font-black mt-3">
                      {title}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {description}
                    </p>

                    <button
                      onClick={() =>
                        showNotice(
                          `${title} generated successfully.`
                        )
                      }
                      className="mt-4 bg-yellow-400 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Generate Report
                    </button>

                  </div>

                ))}

              </div>

            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">

              <div>
                <h2 className="text-2xl font-black">
                  Analytics
                </h2>

                <p className="text-sm text-gray-500">
                  Construction operations analytics
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-xs text-gray-500">
                    Project Completion
                  </p>
                  <p className="text-3xl font-black">
                    {totalProgress}%
                  </p>
                  <div className="h-2 bg-gray-100 rounded mt-3">
                    <div
                      className="h-full bg-yellow-400 rounded"
                      style={{
                        width: `${totalProgress}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-xs text-gray-500">
                    Attendance Rate
                  </p>
                  <p className="text-3xl font-black">
                    {attendanceRate}%
                  </p>
                  <div className="h-2 bg-gray-100 rounded mt-3">
                    <div
                      className="h-full bg-green-500 rounded"
                      style={{
                        width: `${attendanceRate}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-xs text-gray-500">
                    Machine Utilization
                  </p>
                  <p className="text-3xl font-black">
                    {averageUtilization}%
                  </p>
                  <div className="h-2 bg-gray-100 rounded mt-3">
                    <div
                      className="h-full bg-blue-500 rounded"
                      style={{
                        width: `${averageUtilization}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-xs text-gray-500">
                    Active Orders
                  </p>
                  <p className="text-3xl font-black">
                    {orders.length}
                  </p>
                </div>

              </div>

              <div className="bg-white border rounded-2xl p-6">

                <h3 className="font-black mb-5">
                  Project Phase Analytics
                </h3>

                <div className="space-y-5">

                  {phases.map((phase) => (
                    <div key={phase.id}>

                      <div className="flex justify-between text-sm mb-2">

                        <span className="font-bold">
                          {phase.name}
                        </span>

                        <span className="font-black">
                          {phase.completion_pct}%
                        </span>

                      </div>

                      <div className="h-5 bg-gray-100 rounded-full overflow-hidden">

                        <div
                          className="h-full bg-yellow-400"
                          style={{
                            width: `${phase.completion_pct}%`,
                          }}
                        />

                      </div>

                    </div>
                  ))}

                </div>

              </div>

            </div>
          )}

          {/* DOCUMENT MANAGEMENT */}
          {activeTab === 'documents' && (
            <div className="space-y-5">

              <div>
                <h2 className="text-2xl font-black">
                  Document Management
                </h2>

                <p className="text-sm text-gray-500">
                  Upload and manage project documents
                </p>
              </div>

              <div className="bg-white border rounded-2xl p-5">

                <form
                  onSubmit={uploadDocument}
                  className="flex flex-col md:flex-row gap-3"
                >

                  <input
                    type="file"
                    required
                    onChange={(e) =>
                      setDocFile(
                        e.target.files?.[0] ||
                          null
                      )
                    }
                    className="flex-1 border rounded-xl p-2 text-sm"
                  />

                  <button
                    type="submit"
                    className="bg-yellow-400 px-5 py-2 rounded-xl font-black text-sm flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>

                </form>

              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="bg-white border rounded-2xl p-5"
                  >

                    <FileText className="w-7 h-7 text-yellow-600" />

                    <h3 className="font-black mt-3">
                      {document.title}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      {document.category}
                    </p>

                    <p className="text-xs text-gray-500">
                      Owner: {document.owner}
                    </p>

                    <p className="text-xs text-gray-500">
                      Type: {document.type}
                    </p>

                    <div className="flex justify-between mt-4">

                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">
                        {document.status}
                      </span>

                      <button
                        onClick={() =>
                          deleteDocument(
                            document.id
                          )
                        }
                        className="text-red-600 text-xs font-bold"
                      >
                        Delete
                      </button>

                    </div>

                  </div>
                ))}

              </div>

            </div>
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5">

              <h2 className="text-2xl font-black">
                Manager Profile
              </h2>

              <div className="bg-white border rounded-2xl p-6 max-w-2xl">

                <div className="flex items-center gap-4">

                  <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-2xl font-black">
                    R
                  </div>

                  <div>

                    <h3 className="text-xl font-black">
                      {currentUser?.name ||
                        'Rohitha Mamidisetti'}
                    </h3>

                    <p className="text-sm text-gray-500">
                      Project Manager
                    </p>

                  </div>

                </div>

                <div className="grid sm:grid-cols-2 gap-5 mt-6 pt-5 border-t">

                  <div>
                    <p className="text-xs text-gray-400">
                      Email
                    </p>
                    <p className="font-bold">
                      rohitha@buildtrack.com
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Phone
                    </p>
                    <p className="font-bold">
                      +91 98450 77123
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Role
                    </p>
                    <p className="font-bold">
                      Project Manager
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Status
                    </p>
                    <p className="font-bold text-green-600">
                      Active
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* PROJECT MODAL */}
      {openProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl p-6 w-full max-w-md">

            <div className="flex justify-between mb-5">

              <h3 className="font-black">
                Add Project
              </h3>

              <button
                onClick={() =>
                  setOpenProjectModal(false)
                }
              >
                <X />
              </button>

            </div>

            <form
              onSubmit={addProject}
              className="space-y-3"
            >

              <input
                required
                placeholder="Project Name"
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    name: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <select
                value={projectForm.category}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    category: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              >
                {PROJECT_CATEGORIES.map(
                  (category) => (
                    <option key={category}>
                      {category}
                    </option>
                  )
                )}
              </select>

              <input
                required
                placeholder="Location"
                value={projectForm.location}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    location: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <input
                required
                type="number"
                placeholder="Budget"
                value={projectForm.budget}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    budget: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <button
                type="submit"
                className="w-full bg-yellow-400 p-3 rounded-xl font-black"
              >
                Add Project
              </button>

            </form>

          </div>

        </div>
      )}

      {/* ASSET MODAL */}
      {openAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl p-6 w-full max-w-md">

            <div className="flex justify-between mb-5">

              <h3 className="font-black">
                Add Machinery
              </h3>

              <button
                onClick={() =>
                  setOpenAssetModal(false)
                }
              >
                <X />
              </button>

            </div>

            <form
              onSubmit={addAsset}
              className="space-y-3"
            >

              <input
                required
                placeholder="Machine Name"
                value={assetForm.name}
                onChange={(e) =>
                  setAssetForm({
                    ...assetForm,
                    name: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <select
                value={assetForm.category}
                onChange={(e) =>
                  setAssetForm({
                    ...assetForm,
                    category: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              >
                {RESOURCE_CATEGORIES.map(
                  (category) => (
                    <option key={category}>
                      {category}
                    </option>
                  )
                )}
              </select>

              <input
                required
                type="number"
                min="1"
                placeholder="Quantity"
                value={assetForm.quantity}
                onChange={(e) =>
                  setAssetForm({
                    ...assetForm,
                    quantity: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <input
                type="number"
                min="0"
                max="100"
                placeholder="Utilization %"
                value={
                  assetForm.utilization_percentage
                }
                onChange={(e) =>
                  setAssetForm({
                    ...assetForm,
                    utilization_percentage:
                      e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <button
                type="submit"
                className="w-full bg-yellow-400 p-3 rounded-xl font-black"
              >
                Add Machinery
              </button>

            </form>

          </div>

        </div>
      )}

      {/* MATERIAL MODAL */}
      {openMaterialModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl p-6 w-full max-w-md">

            <div className="flex justify-between mb-5">

              <h3 className="font-black">
                Add Material
              </h3>

              <button
                onClick={() =>
                  setOpenMaterialModal(false)
                }
              >
                <X />
              </button>

            </div>

            <form
              onSubmit={addMaterial}
              className="space-y-3"
            >

              <input
                required
                placeholder="Material Name"
                value={materialForm.material_name}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    material_name:
                      e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <select
                value={materialForm.category}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    category: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              >
                {MATERIAL_CATEGORIES.map(
                  (category) => (
                    <option key={category}>
                      {category}
                    </option>
                  )
                )}
              </select>

              <input
                required
                type="number"
                placeholder="Quantity"
                value={materialForm.quantity}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    quantity: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <input
                placeholder="Unit"
                value={materialForm.unit}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    unit: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <input
                required
                placeholder="Supplier"
                value={materialForm.supplier}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    supplier: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <button
                type="submit"
                className="w-full bg-yellow-400 p-3 rounded-xl font-black"
              >
                Add Material
              </button>

            </form>

          </div>

        </div>
      )}

      {/* ORDER MODAL */}
      {openOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl p-6 w-full max-w-md">

            <div className="flex justify-between mb-5">

              <h3 className="font-black">
                Create Procurement Order
              </h3>

              <button
                onClick={() =>
                  setOpenOrderModal(false)
                }
              >
                <X />
              </button>

            </div>

            <form
              onSubmit={addOrder}
              className="space-y-3"
            >

              <input
                required
                placeholder="Item Name"
                value={orderForm.item}
                onChange={(e) =>
                  setOrderForm({
                    ...orderForm,
                    item: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <input
                required
                placeholder="Quantity"
                value={orderForm.quantity}
                onChange={(e) =>
                  setOrderForm({
                    ...orderForm,
                    quantity: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <input
                required
                placeholder="Supplier"
                value={orderForm.supplier}
                onChange={(e) =>
                  setOrderForm({
                    ...orderForm,
                    supplier: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <input
                required
                type="number"
                placeholder="Amount"
                value={orderForm.amount}
                onChange={(e) =>
                  setOrderForm({
                    ...orderForm,
                    amount: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <button
                type="submit"
                className="w-full bg-yellow-400 p-3 rounded-xl font-black"
              >
                Create Order
              </button>

            </form>

          </div>

        </div>
      )}

      {/* NOTIFICATION MODAL */}
      {openNotificationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl p-6 w-full max-w-md">

            <div className="flex justify-between mb-5">

              <h3 className="font-black">
                New Notification
              </h3>

              <button
                onClick={() =>
                  setOpenNotificationModal(false)
                }
              >
                <X />
              </button>

            </div>

            <form
              onSubmit={addNotification}
              className="space-y-3"
            >

              <input
                required
                placeholder="Notification Title"
                value={notificationForm.title}
                onChange={(e) =>
                  setNotificationForm({
                    ...notificationForm,
                    title: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <textarea
                required
                placeholder="Notification Message"
                value={notificationForm.message}
                onChange={(e) =>
                  setNotificationForm({
                    ...notificationForm,
                    message: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              />

              <select
                value={notificationForm.type}
                onChange={(e) =>
                  setNotificationForm({
                    ...notificationForm,
                    type: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              >
                <option>General</option>
                <option>Safety</option>
                <option>Project</option>
                <option>Inventory</option>
                <option>Procurement</option>
              </select>

              <button
                type="submit"
                className="w-full bg-yellow-400 p-3 rounded-xl font-black"
              >
                Create Notification
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default Dashboard;
