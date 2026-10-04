import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
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

export const Dashboard = ({ currentUser, onLogout }) => {
  const role = String(currentUser?.role || '').trim();
  const isAdmin = role === 'Administrator';
  const isPM = role === 'Project Manager';
  const isSiteEngineer = role === 'Site Engineer';
  const isWorker = role === 'Worker' || role === 'Site Worker';
  const isClient = role === 'Client';

  const roleTabs = useMemo(() => {
    if (isAdmin) return new Set(['overview', 'projects', 'workforce', 'phases', 'resources', 'inventory', 'procurement', 'reports', 'analytics', 'notifications', 'profile']);
    if (isPM) return new Set(['overview', 'projects', 'workforce', 'attendance', 'phases', 'resources', 'inventory', 'procurement', 'reports', 'analytics', 'documents', 'notifications', 'profile']);
    if (isSiteEngineer) return new Set(['overview', 'attendance', 'phases', 'notifications', 'profile']);
    if (isWorker) return new Set(['overview', 'attendance', 'notifications', 'profile']);
    if (isClient) return new Set(['overview', 'notifications', 'profile']);
    return new Set(['overview', 'profile']);
  }, [isAdmin, isPM, isSiteEngineer, isWorker, isClient]);

  const [activeTab, setActiveTab] = useState('overview');
  const [notice, setNotice] = useState('');

  const [projects, setProjects] = useState([]);
  const [projectManagers, setProjectManagers] = useState([]);
  const [workforceAllocations, setWorkforceAllocations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [availableSiteEngineers, setAvailableSiteEngineers] = useState([]);

  const [phases, setPhases] = useState([]);

  const [resources, setResources] = useState([]);

  const [inventory, setInventory] = useState([]);

  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceProjectId, setAttendanceProjectId] = useState('');

  const [orders, setOrders] = useState([]);

  const [notifications, setNotifications] = useState([]);

  const [documents, setDocuments] = useState([]);
  const [profile, setProfile] = useState(currentUser || null);

  const [openProjectModal, setOpenProjectModal] = useState(false);
  const [openAssetModal, setOpenAssetModal] = useState(false);
  const [openMaterialModal, setOpenMaterialModal] = useState(false);
  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [openAllocationModal, setOpenAllocationModal] = useState(false);
  const [allocationUserType, setAllocationUserType] = useState('Worker');
  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [openPayrollModal, setOpenPayrollModal] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notificationSendToAll, setNotificationSendToAll] = useState(false);
  const [notificationRecipientId, setNotificationRecipientId] = useState('');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [openMilestoneForm, setOpenMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    project_id: '',
    name: '',
    description: '',
    due_date: '',
    completed_date: '',
    status: 'Pending',
    completion_pct: '0',
  });
  const [editingMilestoneId, setEditingMilestoneId] = useState(null);
  const [notificationForm, setNotificationForm] = useState({
    project_id: '',
    user_ids: [],
    title: '',
    message: '',
    notification_type: '',
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    category: '',
    location: '',
    budget: '',
  });

  const [assetForm, setAssetForm] = useState({
    name: '',
    category: '',
    quantity: '',
    status: '',
    project_id: '',
  });

  const [materialForm, setMaterialForm] = useState({
    material_name: '',
    category: '',
    quantity: '',
    minimum_stock: '',
    unit: '',
    supplier: '',
    project_id: '',
  });

  const RESOURCE_CATEGORIES = ['EXCAVATORS', 'CONCRETE_MIXERS', 'CRANES', 'DUMP_TRUCKS', 'GENERATORS', 'SAFETY_EQUIPMENT'];
  const MATERIAL_CATEGORIES = ['CEMENT', 'STEEL', 'BRICKS', 'SAND', 'CONCRETE', 'ELECTRICAL_MATERIALS', 'PLUMBING_MATERIALS'];
  const formatCategory = (category) => category
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const uniqueWorkforceAllocations = (allocations) => {
    const seen = new Set();
    return allocations.filter((allocation) => {
      const key = [
        allocation.worker_id,
        allocation.project_id,
        String(allocation.role || '').trim().toLowerCase(),
        allocation.start_date || '',
        allocation.end_date || '',
        String(allocation.status || '').trim().toUpperCase(),
      ].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const [orderForm, setOrderForm] = useState({
    project_id: '',
    item: '',
    quantity: '',
    supplier: '',
    amount: '',
  });

  const [allocationForm, setAllocationForm] = useState({ worker_id: '', project_id: '', role: '', start_date: '', end_date: '', status: 'ACTIVE' });
  const [shiftForm, setShiftForm] = useState({ project_id: '', shift_name: '', shift_date: '', start_time: '', end_time: '', status: 'SCHEDULED' });
  const [payrollForm, setPayrollForm] = useState({ worker_id: '', project_id: '', pay_period_start: '', pay_period_end: '', days_worked: '', daily_wage: '', overtime: '', deductions: '', payment_status: 'PENDING' });

  const [docFile, setDocFile] = useState(null);
  const [attendanceSearch, setAttendanceSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsProjectId, setAnalyticsProjectId] = useState('');
  const [reportProjectId, setReportProjectId] = useState('');

  const normalizeDocuments = (rows) => (Array.isArray(rows) ? rows : []).map((doc) => ({
    ...doc,
    type: doc.type || doc.fileType || 'FILE',
    date: doc.date || doc.updated || (doc.created_at ? String(doc.created_at).slice(0, 10) : ''),
  }));

  const loadDashboardData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const calls = [];
      const keys = [];
      const add = (key, promise) => { keys.push(key); calls.push(promise); };

      add('profile', api.getProfile());
      add('notifications', api.getNotifications());

      if (isAdmin) add('projectManagers', api.getProjectManagers());
      if (isAdmin || isPM) add('siteEngineers', api.getSiteEngineers());

      if (isAdmin || isPM) {
        add('projects', api.getProjects());
        add('progress', api.getProgress());
        add('resources', api.getResources());
        add('inventory', api.getInventory());
        add('workers', api.getWorkers());
        add('workforce', api.getWorkforceAllocations());
        add('shifts', api.getShifts());
        add('payroll', api.getPayroll());
        if (isPM || isAdmin) add('attendance', api.getAttendance());
        add('procurements', api.getProcurements());
        add('documents', api.getDocuments());
        add('analytics', api.getDashboardAnalytics());
      } else if (isSiteEngineer) {
        add('projects', api.getProjects());
        add('progress', api.getProgress());
        add('workers', api.getWorkers());
        add('workforce', api.getWorkforceAllocations());
        add('attendance', api.getAttendance());
      } else if (isWorker) {
        add('projects', api.getProjects());
        add('workers', api.getWorkers());
        add('attendance', api.getAttendance());
        add('workforce', api.getWorkforceAllocations());
        add('shifts', api.getShifts());
      } else if (isClient) {
        // No client -> project relationship exists in the backend, so no project data is fetched.
      }

      const results = await Promise.allSettled(calls);
      const data = {};
      results.forEach((result, index) => {
        data[keys[index]] = result.status === 'fulfilled' ? result.value : null;
      });

      const unwrap = (value, names) => {
        if (Array.isArray(value)) return value;
        for (const name of names) if (Array.isArray(value?.[name])) return value[name];
        return [];
      };

      if (data.profile?.user) setProfile(data.profile.user);

      const allProjects = unwrap(data.projects, ['projects']);
      setProjectManagers(unwrap(data.projectManagers, ['project_managers', 'projectManagers']));
      const workforce = unwrap(data.workforce, ['workforce_allocations', 'allocations']);
      const assignedSiteEngineerProjectIds = new Set(workforce
        .filter((allocation) => Number(allocation.worker_id) === Number(currentUser?.id) &&
          String(allocation.status || '').trim().toUpperCase() === 'ACTIVE')
        .map((allocation) => Number(allocation.project_id)));
      const assignedWorkerProjectIds = new Set(workforce
        .filter((allocation) => Number(allocation.worker_id) === Number(currentUser?.id))
        .map((allocation) => Number(allocation.project_id)));
      const visibleProjects = isPM
        ? allProjects.filter((project) => Number(project.manager_id) === Number(currentUser?.id))
        : isSiteEngineer
          ? allProjects.filter((project) => assignedSiteEngineerProjectIds.has(Number(project.id)))
          : isWorker
            ? allProjects.filter((project) => assignedWorkerProjectIds.has(Number(project.id)))
        : allProjects;
      setProjects(visibleProjects);

      const allProgress = unwrap(data.progress, ['progress']);
      setPhases((isPM || isAdmin || isSiteEngineer) ? allProgress.filter((phase) => {
        if (isSiteEngineer) return visibleProjects.some((project) => Number(project.id) === Number(phase.project_id));
        if (!isPM) return true;
        return visibleProjects.some((project) => Number(project.id) === Number(phase.project_id));
      }) : []);

      const allResources = unwrap(data.resources, ['resources']);
      const allInventory = unwrap(data.inventory, ['inventory']);

      const workers = unwrap(data.workers, ['workers']);
      const attendance = unwrap(data.attendance, ['attendance']);
      const loadedShifts = unwrap(data.shifts, ['shifts']);
      const loadedPayroll = unwrap(data.payroll, ['payroll']);
      const visibleProjectIds = new Set(visibleProjects.map((project) => Number(project.id)));
      const visibleWorkforce = isPM || isSiteEngineer || isWorker
        ? workforce.filter((row) => visibleProjectIds.has(Number(row.project_id)))
        : workforce;
      const visibleWorkerIds = new Set(visibleWorkforce.map((row) => Number(row.worker_id)));
      const visibleWorkers = isPM
        ? workers.filter((worker) => visibleWorkerIds.has(Number(worker.id)))
        : isSiteEngineer
          ? workers.filter((worker) => visibleWorkerIds.has(Number(worker.id)))
          : isWorker
          ? workers.filter((worker) => Number(worker.id) === Number(currentUser?.id))
          : workers;
      const workersById = new Map(workers.map((worker) => [Number(worker.id), worker]));
      setAvailableWorkers(workers);
      setAvailableSiteEngineers(unwrap(data.siteEngineers, ['site_engineers', 'siteEngineers']));
      setWorkers(isPM || isWorker ? visibleWorkers : workers);
      setAttendanceRecords(attendance);
      if (isSiteEngineer) {
        const allocatedProject = visibleWorkforce.find((allocation) => String(allocation.status || '').trim().toUpperCase() === 'ACTIVE')?.project_id;
        if (!attendanceProjectId || !visibleProjectIds.has(Number(attendanceProjectId))) {
          setAttendanceProjectId(allocatedProject ? String(allocatedProject) : '');
        }
      }
      setResources(isPM ? allResources.filter((row) => visibleProjectIds.has(Number(row.project_id))) : allResources);
      setInventory(isPM ? allInventory.filter((row) => visibleProjectIds.has(Number(row.project_id))) : allInventory);
      setWorkforceAllocations(uniqueWorkforceAllocations(visibleWorkforce));
      setShifts(isPM ? loadedShifts.filter((row) => visibleProjectIds.has(Number(row.project_id))) : loadedShifts);
      setPayroll(isPM ? loadedPayroll.filter((row) => row.project_id == null || visibleProjectIds.has(Number(row.project_id))) : loadedPayroll);

      const scopedAttendanceRecords = attendance.filter((record) => {
        if (isPM || isSiteEngineer) return visibleWorkerIds.has(Number(record.worker_id));
        if (isWorker) return Number(record.worker_id) === Number(currentUser?.id);
        return false;
      });
      const attendanceByWorker = new Map();
      scopedAttendanceRecords.forEach((record) => {
        const key = Number(record.worker_id);
        attendanceByWorker.set(key, [...(attendanceByWorker.get(key) || []), record]);
      });
      const attendanceWorkers = isPM || isSiteEngineer || isWorker
        ? visibleWorkers
        : [];
      setEmployees(attendanceWorkers.flatMap((worker) => {
        const records = attendanceByWorker.get(Number(worker.id)) || [];
        const workerDetails = workersById.get(Number(worker.id)) || worker;
        const projectNames = visibleWorkforce
          .filter((allocation) => Number(allocation.worker_id) === Number(worker.id))
          .map((allocation) => visibleProjects.find((project) => Number(project.id) === Number(allocation.project_id))?.name)
          .filter(Boolean);
        return (records.length ? records : [null]).map((record) => ({
          ...(record || {}),
          id: record?.id || `worker-${worker.id}`,
          worker_id: worker.id,
          name: workerDetails.name || `Worker #${worker.id}`,
          role: workerDetails.role || 'Worker',
          date: record ? attendanceDateKey(record.attendance_date) : 'No record',
          status: record ? normalizeAttendanceStatus(record.status) : 'No record',
          project_names: [...new Set(projectNames)],
        }));
      }));

      const loadedOrders = unwrap(data.procurements, ['procurements']);
      setOrders((isPM ? loadedOrders.filter((row) => visibleProjectIds.has(Number(row.project_id))) : loadedOrders).map((item) => ({
        ...item,
        item: item.item || item.item_name,
        amount: item.amount ?? item.total_cost ?? (Number(item.quantity || 0) * Number(item.unit_price || 0)),
        quantity: item.quantity,
      })));

      setAnalytics(data.analytics || null);
      setNotifications(unwrap(data.notifications, ['notifications']));
      setDocuments(unwrap(data.documents, ['documents']).map((doc) => ({
        ...doc,
        type: doc.type || doc.fileType || 'FILE',
        date: doc.date || doc.updated || (doc.created_at ? String(doc.created_at).slice(0, 10) : ''),
      })));

      if (isWorker) {
        setPhases([]);
      }

      const failed = results
        .map((result, index) => ({ result, key: keys[index] }))
        .filter(({ result }) => result.status === 'rejected');
      if (failed.length) {
        setLoadError(failed
          .map(({ result, key }) => `${key}: ${result.reason?.message || 'Unable to load this section.'}`)
          .join(' · '));
      }
    } catch (error) {
      setLoadError(error.message || 'Something went wrong while loading your workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [role, currentUser?.id]);


  const showNotice = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 2500);
  };

  const normalizeAttendanceStatus = (status) => {
    const value = String(status || '').toUpperCase();
    if (value === 'PRESENT') return 'Present';
    if (value === 'ABSENT') return 'Absent';
    if (value === 'LEAVE') return 'Leave';
    return status || '';
  };

  const attendanceDateKey = (value) => {
    if (!value) return '';
    const dateText = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return dateText;
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return dateText.slice(0, 10);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const totalProgress = useMemo(() => {
    const validPhases = phases.filter((phase) => Number.isFinite(Number(phase.completion_pct)));
    if (validPhases.length) {
      return Math.round(
        validPhases.reduce((sum, phase) => sum + Number(phase.completion_pct), 0) / validPhases.length
      );
    }
    const milestoneCount = Number(analytics?.progress?.total_milestones || 0);
    const apiValue = Number(analytics?.progress?.average_completion);
    return milestoneCount > 0 && Number.isFinite(apiValue) ? Math.round(apiValue) : null;
  }, [phases, analytics]);

  const totalBudget = useMemo(
    () =>
      projects.reduce(
        (sum, project) => sum + Number(project.budget || 0),
        0
      ),
    [projects]
  );
  const displayedPhases = (isPM || isSiteEngineer) && selectedProjectId
    ? phases.filter((phase) => Number(phase.project_id) === Number(selectedProjectId))
    : phases;
  const displayedProgress = displayedPhases.length
    ? Math.round(displayedPhases.reduce((sum, phase) => sum + Number(phase.completion_pct || 0), 0) / displayedPhases.length)
    : null;
  const analyticsProject = projects.find((project) =>
    Number(project.id) === Number(analyticsProjectId)
  ) || projects[0];
  const analyticsProjectPhases = analyticsProject
    ? phases.filter((phase) => Number(phase.project_id) === Number(analyticsProject.id))
    : [];
  const analyticsProjectProgress = analyticsProjectPhases.length
    ? Math.round(analyticsProjectPhases.reduce((sum, phase) => sum + Number(phase.completion_pct || 0), 0) / analyticsProjectPhases.length)
    : null;
  const analyticsProjectWorkerIds = new Set(workforceAllocations
    .filter((allocation) =>
      analyticsProject &&
      Number(allocation.project_id) === Number(analyticsProject.id) &&
      String(allocation.status || '').trim().toUpperCase() === 'ACTIVE' &&
      String(allocation.role || '').trim().toUpperCase() !== 'SITE ENGINEER'
    )
    .map((allocation) => Number(allocation.worker_id)));
  const today = new Date();
  const todayAttendanceDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const analyticsProjectPresentWorkerIds = new Set(attendanceRecords
    .filter((record) =>
      analyticsProjectWorkerIds.has(Number(record.worker_id)) &&
      attendanceDateKey(record.attendance_date) === todayAttendanceDate &&
      normalizeAttendanceStatus(record.status) === 'Present'
    )
    .map((record) => Number(record.worker_id)));
  const analyticsProjectAttendanceRate = analyticsProjectWorkerIds.size
    ? Math.round((analyticsProjectPresentWorkerIds.size / analyticsProjectWorkerIds.size) * 100)
    : 0;
  const analyticsProjectOrders = analyticsProject
    ? orders.filter((order) => Number(order.project_id) === Number(analyticsProject.id))
    : [];

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
    employees.length ? (presentCount / employees.length) * 100 : 0
  );

  const filteredEmployees = employees.filter((employee) => {
    const search = attendanceSearch.trim().toLowerCase();

    if (!search) return true;

    return [
      employee.name,
      employee.role,
      ...(employee.project_names || []),
      employee.date,
      employee.status,
      employee.check_in,
      employee.check_out,
      employee.id,
    ].some((value) =>
      String(value).toLowerCase().includes(search)
    );
  });

  const siteEngineerAttendanceWorkers = (() => {
    if (!isSiteEngineer || !attendanceProjectId) return [];
    const assignedWorkerIds = new Set(workforceAllocations
      .filter((allocation) =>
        Number(allocation.project_id) === Number(attendanceProjectId) &&
        String(allocation.status || '').trim().toUpperCase() === 'ACTIVE'
      )
      .map((allocation) => Number(allocation.worker_id)));
    const workersById = new Map(workers.map((worker) => [Number(worker.id), worker]));
    const project = projects.find((item) => Number(item.id) === Number(attendanceProjectId));
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return [...assignedWorkerIds].flatMap((workerId) => {
      const worker = workersById.get(workerId);
      if (!worker) return [];
      const workerRecords = attendanceRecords.filter((record) => Number(record.worker_id) === workerId);
      const record = workerRecords.find((item) => attendanceDateKey(item.attendance_date) === localDate) || null;
      return [{
        ...(record || {}),
        id: record?.id || `worker-${worker.id}`,
        worker_id: worker.id,
        name: worker.name || `Worker #${worker.id}`,
        role: worker.role || 'Worker',
        date: record ? attendanceDateKey(record.attendance_date) : 'No record',
        status: record ? normalizeAttendanceStatus(record.status) : 'No record',
        project_names: project ? [project.name] : [],
      }];
    });
  })();

  const displayedAttendanceEmployees = isSiteEngineer ? siteEngineerAttendanceWorkers : employees;
  const displayedFilteredEmployees = displayedAttendanceEmployees.filter((employee) => {
    const search = attendanceSearch.trim().toLowerCase();
    if (!search) return true;
    return [
      employee.name,
      employee.role,
      ...(employee.project_names || []),
      employee.date,
      employee.status,
      employee.check_in,
      employee.check_out,
      employee.id,
    ].some((value) => String(value).toLowerCase().includes(search));
  });


  const updateAttendance = async (record, status) => {
    try {
      let response;
      const attendanceStatus = status === 'Present'
        ? 'PRESENT'
        : status === 'Absent'
          ? 'ABSENT'
          : 'LEAVE';
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const allocatedProject = workforceAllocations.find((allocation) =>
        Number(allocation.worker_id) === Number(record.worker_id) &&
        String(allocation.status || '').trim().toUpperCase() === 'ACTIVE' &&
        (isSiteEngineer
          ? Number(allocation.project_id) === Number(attendanceProjectId)
          : true)
      )?.project_id;
      const attendanceProject = isSiteEngineer ? attendanceProjectId : allocatedProject;
      if (!isSiteEngineer && record.id && !String(record.id).startsWith('worker-')) {
        response = await api.updateAttendance(record.id, {
          worker_id: record.worker_id,
          project_id: attendanceProject ? Number(attendanceProject) : null,
          attendance_date: record.attendance_date,
          status: attendanceStatus,
          check_in: record.check_in,
          check_out: record.check_out,
        });
      } else {
        response = await api.createAttendance({
          worker_id: record.worker_id,
          project_id: attendanceProject ? Number(attendanceProject) : null,
          ...(!isSiteEngineer ? { attendance_date: localDate } : {}),
          status: attendanceStatus,
        });
      }
      const updated = response?.attendance || response;
      setAttendanceRecords((items) => {
        if (updated.id) {
          return items.some((item) => Number(item.id) === Number(updated.id))
            ? items.map((item) => Number(item.id) === Number(updated.id) ? { ...item, ...updated } : item)
            : [...items, updated];
        }
        return items;
      });
      setEmployees((items) => items.map((item) => (
        item.id === record.id || (String(record.id).startsWith('worker-') && item.worker_id === record.worker_id)
      ) ? {
        ...item,
        ...updated,
        id: updated.id || item.id,
        worker_id: record.worker_id,
        date: updated.attendance_date ? attendanceDateKey(updated.attendance_date) : item.date,
        status: normalizeAttendanceStatus(updated.status || status),
      } : item));
      showNotice('Attendance updated successfully.');
    } catch (error) {
      showNotice(error.data?.error ? `${error.message}: ${error.data.error}` : error.message);
    }
  };

  const updatePhase = async (id, value) => {
    const current = phases.find((phase) => phase.id === id);
    if (!current) return;
    const percentage = Number(value);
    const status = percentage === 100 ? 'Completed' : percentage === 0 ? 'Pending' : 'In Progress';
    try {
      const response = await api.updateProgress(id, {
        project_id: current.project_id,
        name: current.name,
        description: current.description,
        due_date: current.due_date,
        completed_date: current.completed_date,
        status,
        completion_pct: percentage,
      });
      const updated = response?.progress || response;
      setPhases((items) => items.map((phase) => phase.id === id ? { ...phase, ...updated } : phase));
      showNotice('Progress updated successfully.');
    } catch (error) { showNotice(error.message); }
  };

  const startMilestoneCreation = () => {
    if (!isSiteEngineer || !projects.length) return;
    const projectId = selectedProjectId || String(projects[0].id);
    setSelectedProjectId(projectId);
    setEditingMilestoneId(null);
    setOpenMilestoneForm(true);
    setMilestoneForm({
      project_id: projectId,
      name: '',
      description: '',
      due_date: '',
      completed_date: '',
      status: 'Pending',
      completion_pct: '0',
    });
  };

  const editMilestone = async (id) => {
    if (!isSiteEngineer) return;
    try {
      const response = await api.getProgressById(id);
      const milestone = response?.progress || response;
      const project = projects.find((item) => Number(item.id) === Number(milestone.project_id));
      if (!project) {
        showNotice('You can only edit milestones from projects assigned to you.');
        return;
      }
      setSelectedProjectId(String(project.id));
      setEditingMilestoneId(milestone.id);
      setOpenMilestoneForm(true);
      setMilestoneForm({
        project_id: String(project.id),
        name: milestone.name || '',
        description: milestone.description || '',
        due_date: milestone.due_date ? String(milestone.due_date).slice(0, 10) : '',
        completed_date: milestone.completed_date ? String(milestone.completed_date).slice(0, 10) : '',
        status: milestone.status || 'Pending',
        completion_pct: String(milestone.completion_pct ?? 0),
      });
    } catch (error) {
      showNotice(error.message);
    }
  };

  const deleteMilestone = async (milestone) => {
    if (!isSiteEngineer || !projects.some((project) => Number(project.id) === Number(milestone.project_id))) {
      showNotice('You can only delete milestones from projects assigned to you.');
      return;
    }
    if (!window.confirm(`Delete milestone "${milestone.name || 'Milestone'}"?`)) return;
    try {
      await api.deleteProgress(milestone.id);
      const response = await api.getProgress();
      const records = Array.isArray(response) ? response : response?.progress || [];
      setPhases(records.filter((item) => projects.some((project) => Number(project.id) === Number(item.project_id))));
      showNotice('Milestone deleted successfully.');
    } catch (error) {
      showNotice(error.message);
    }
  };

  const saveMilestone = async (event) => {
    event.preventDefault();
    if (!isSiteEngineer) return;
    const project = projects.find((item) => Number(item.id) === Number(milestoneForm.project_id));
    if (!project) {
      showNotice('Select one of your own projects.');
      return;
    }
    const currentMilestone = editingMilestoneId
      ? phases.find((item) => Number(item.id) === Number(editingMilestoneId))
      : null;
    if (editingMilestoneId && (!currentMilestone || !projects.some((item) => Number(item.id) === Number(currentMilestone.project_id)))) {
      showNotice('The selected milestone is not associated with an available project.');
      return;
    }
    const body = {
      project_id: Number(currentMilestone?.project_id || project.id),
      name: milestoneForm.name.trim(),
      description: milestoneForm.description.trim(),
      due_date: milestoneForm.due_date || null,
      completed_date: milestoneForm.completed_date || null,
      status: milestoneForm.status,
      completion_pct: Number(milestoneForm.completion_pct),
    };
    try {
      if (editingMilestoneId) {
        const response = await api.updateProgress(editingMilestoneId, body);
        const updated = response?.progress || response;
        setPhases((items) => items.map((item) => Number(item.id) === Number(editingMilestoneId) ? { ...item, ...updated } : item));
        showNotice('Milestone updated successfully.');
      } else {
        const response = await api.createProgress(body);
        const created = response?.progress || response;
        setPhases((items) => [...items, created]);
        showNotice('Milestone created successfully.');
      }
      setEditingMilestoneId(null);
      setOpenMilestoneForm(false);
      setMilestoneForm({
        project_id: String(project.id),
        name: '',
        description: '',
        due_date: '',
        completed_date: '',
        status: 'Pending',
        completion_pct: '0',
      });
    } catch (error) {
      showNotice(error.message);
    }
  };

  const notificationRecipientWorkers = (() => {
    const eligibleWorkers = workers.filter((worker) => worker.is_active !== false);
    if (!isPM) return eligibleWorkers;
    const projectId = Number(notificationForm.project_id);
    if (!projects.some((project) => Number(project.id) === projectId)) return [];
    const eligibleIds = new Set(workforceAllocations
      .filter((allocation) => Number(allocation.project_id) === projectId && String(allocation.status || '').trim().toUpperCase() === 'ACTIVE')
      .map((allocation) => Number(allocation.worker_id)));
    return eligibleWorkers.filter((worker) => eligibleIds.has(Number(worker.id)));
  })();

  const createNotification = async (event) => {
    event.preventDefault();
    const recipients = notificationSendToAll
      ? notificationRecipientWorkers.map((worker) => Number(worker.id))
      : notificationForm.user_ids.map(Number);
    if (isPM && !projects.some((project) => Number(project.id) === Number(notificationForm.project_id))) {
      showNotice('Select one of your own projects.');
      return;
    }
    if (!recipients.length || recipients.some((id) => !notificationRecipientWorkers.some((worker) => Number(worker.id) === id))) {
      showNotice(notificationSendToAll ? 'There are no eligible workers to notify.' : 'Select at least one eligible worker.');
      return;
    }
    const results = await Promise.allSettled(recipients.map((user_id) => api.createNotification({
      user_id,
      title: notificationForm.title.trim(),
      message: notificationForm.message.trim(),
      notification_type: notificationForm.notification_type.trim(),
    })));
    const sentCount = results.filter((result) => result.status === 'fulfilled').length;
    const failedCount = results.length - sentCount;
    if (sentCount) {
      setNotificationForm({ project_id: notificationForm.project_id, user_ids: [], title: '', message: '', notification_type: '' });
      setNotificationRecipientId('');
      setNotificationSendToAll(false);
      if (!failedCount) setShowNotificationForm(false);
    }
    if (failedCount) {
      const failure = results.find((result) => result.status === 'rejected');
      showNotice(`${sentCount} sent; ${failedCount} failed. ${failure.reason?.message || ''}`.trim());
    } else {
      showNotice(`${sentCount} notification${sentCount === 1 ? '' : 's'} sent.`);
    }
  };

  const addProject = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      const body = { ...projectForm, budget: Number(projectForm.budget || 0) };
      if (editingProjectId) {
        const currentProject = projects.find((project) => Number(project.id) === Number(editingProjectId));
        if (!currentProject) {
          showNotice('The selected project could not be found.');
          return;
        }
        const response = await api.updateProject(editingProjectId, {
          ...currentProject,
          ...body,
          manager_id: currentProject.manager_id || null,
        });
        const updated = response?.project || response;
        setProjects((items) => items.map((project) => Number(project.id) === Number(editingProjectId) ? { ...project, ...updated } : project));
        showNotice('Project updated successfully.');
      } else {
        const response = await api.createProject(body);
        setProjects((items) => [...items, response?.project || response]);
        showNotice('Project added successfully.');
      }
      setProjectForm({ name: '', category: '', location: '', budget: '' });
      setEditingProjectId(null);
      setOpenProjectModal(false);
    } catch (error) { showNotice(error.message); }
  };

  const startProjectEdit = (project) => {
    if (!isAdmin) return;
    setEditingProjectId(project.id);
    setProjectForm({
      name: project.name || '',
      category: project.category || '',
      location: project.location || '',
      budget: String(project.budget ?? ''),
    });
    setOpenProjectModal(true);
  };

  const addAsset = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createResource({
        ...assetForm,
        quantity: Number(assetForm.quantity),
        status: assetForm.status || 'AVAILABLE',
        project_id: assetForm.project_id || null,
      });
      setResources((items) => [...items, response?.resource || response]);
      setAssetForm({ name: '', category: '', quantity: '', status: '', project_id: '' });
      setOpenAssetModal(false);
      showNotice('Machinery added successfully.');
    } catch (error) { showNotice(error.message); }
  };

  const addMaterial = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createInventory({ ...materialForm, project_id: materialForm.project_id || null, quantity: Number(materialForm.quantity), minimum_stock: Number(materialForm.minimum_stock) });
      setInventory((items) => [...items, response?.inventory || response]);
      setMaterialForm({ material_name: '', category: '', quantity: '', minimum_stock: '', unit: '', supplier: '', project_id: '' });
      setOpenMaterialModal(false);
      showNotice('Material added successfully.');
    } catch (error) { showNotice(error.message); }
  };

  const addOrder = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createProcurement({
        project_id: orderForm.project_id,
        item_name: orderForm.item,
        quantity: Number(orderForm.quantity),
        unit_price: Number(orderForm.amount),
        supplier: orderForm.supplier,
        status: 'REQUESTED',
      });
      const order = response?.procurement || response;
      setOrders((items) => [{ ...order, item: order.item_name, amount: Number(order.quantity || 0) * Number(order.unit_price || 0) }, ...items]);
      setOrderForm({ item: '', quantity: '', supplier: '', amount: '', project_id: '' });
      setOpenOrderModal(false);
      showNotice('Procurement order created.');
    } catch (error) { showNotice(error.message); }
  };

  const uploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile) { showNotice('Please select a file.'); return; }
    const formData = new FormData();
    formData.append('file', docFile);
    formData.append('title', docFile.name);
    formData.append('category', 'Reports');
    try {
      const response = await api.uploadDocument(formData);
      setDocuments((items) => [response, ...items]);
      setDocFile(null);
      e.target.reset();
      showNotice('Document uploaded successfully.');
    } catch (error) { showNotice(error.message); }
  };

  const addWorkforceAllocation = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createWorkforceAllocation({
        ...allocationForm,
        role: allocationUserType === 'Site Engineer' ? 'Site Engineer' : allocationForm.role,
        worker_id: Number(allocationForm.worker_id),
        project_id: Number(allocationForm.project_id),
        end_date: allocationForm.end_date || null,
      });
      const allocation = response?.allocation || response;
      setWorkforceAllocations((items) => uniqueWorkforceAllocations([allocation, ...items]));
      if (allocationUserType === 'Worker') {
        const worker = availableWorkers.find((item) => Number(item.id) === Number(allocation.worker_id));
        if (worker) setWorkers((items) => items.some((item) => Number(item.id) === Number(worker.id)) ? items : [...items, worker]);
      }
      setAllocationForm({ worker_id: '', project_id: '', role: '', start_date: '', end_date: '', status: 'ACTIVE' });
      setOpenAllocationModal(false);
      showNotice(`${allocationUserType} added to the project successfully.`);
    } catch (error) {
      if (error.status === 403 && error.message === 'Access denied') {
        showNotice(`The backend denied workforce assignment for the signed-in role (${role || 'unknown'}). Sign in as a Project Manager or Administrator and restart the updated backend.`);
      } else {
        showNotice(error.message);
      }
    }
  };

  const addShift = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createShift({ ...shiftForm, project_id: Number(shiftForm.project_id) });
      const shift = response?.shift || response;
      setShifts((items) => [shift, ...items]);
      setShiftForm({ project_id: '', shift_name: '', shift_date: '', start_time: '', end_time: '', status: 'SCHEDULED' });
      setOpenShiftModal(false);
      showNotice('Shift scheduled successfully.');
    } catch (error) { showNotice(error.message); }
  };

  const addPayroll = async (e) => {
    e.preventDefault();
    try {
      const response = await api.createPayroll({ ...payrollForm, worker_id: Number(payrollForm.worker_id), project_id: payrollForm.project_id ? Number(payrollForm.project_id) : null, days_worked: Number(payrollForm.days_worked || 0), daily_wage: Number(payrollForm.daily_wage || 0), overtime: Number(payrollForm.overtime || 0), deductions: Number(payrollForm.deductions || 0) });
      const record = response?.payroll || response;
      setPayroll((items) => [record, ...items]);
      setPayrollForm({ worker_id: '', project_id: '', pay_period_start: '', pay_period_end: '', days_worked: '', daily_wage: '', overtime: '', deductions: '', payment_status: 'PENDING' });
      setOpenPayrollModal(false);
      showNotice('Payroll added successfully.');
    } catch (error) { showNotice(error.message); }
  };

  const assignProjectManager = async (project) => {
    const managerId = project._selected_manager_id;
    if (!managerId) { showNotice('Select a Project Manager first.'); return; }
    try {
      const response = await api.updateProject(project.id, {
        name: project.name,
        description: project.description || '',
        category: project.category || '',
        location: project.location || '',
        start_date: project.start_date || null,
        end_date: project.end_date || null,
        budget: Number(project.budget || 0),
        status: project.status || 'planning',
        manager_id: Number(managerId),
      });
      const updated = response?.project || response;
      setProjects((items) => items.map((item) => item.id === project.id ? { ...item, ...updated } : item));
      showNotice('Project Manager assigned successfully.');
    } catch (error) { showNotice(error.message); }
  };

  const generateReport = async (title, type) => {
    try {
      let response;
      if (type === 'analytical') response = await api.getAnalyticalReport();
      else {
        if (!reportProjectId) { showNotice('Select a project first.'); return; }
        const calls = {
          attendance: api.getAttendanceReport,
          progress: api.getProgressReport,
          procurement: api.getProcurementReport,
          resources: api.getResourceReport,
        };
        response = await calls[type](reportProjectId);
      }

      if (!response || (Array.isArray(response) && response.length === 0)) {
        showNotice('No data available to generate this report.');
        return;
      }

      const projectName = projects.find((project) => Number(project.id) === Number(reportProjectId))?.name;
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 16;
      const usableWidth = pageWidth - margin * 2;
      let y = 20;

      const cleanText = (value) => String(value)
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, '');
      const addLine = (text, size = 10, bold = false, gap = 5) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setFontSize(size);
        const lines = pdf.splitTextToSize(cleanText(text), usableWidth);
        const lineHeight = size * 0.45;
        if (y + lines.length * lineHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(lines, margin, y);
        y += lines.length * lineHeight + gap;
      };
      const appendValue = (value, label, depth = 0) => {
        if (Array.isArray(value)) {
          if (!value.length) addLine(`${label}: None`);
          value.forEach((item, index) => {
            addLine(`${label} ${index + 1}`, 11, true, 3);
            appendValue(item, '', depth + 1);
          });
          return;
        }
        if (value && typeof value === 'object') {
          Object.entries(value).forEach(([key, item]) => {
            const itemLabel = label ? `${label} - ${key.replace(/_/g, ' ')}` : key.replace(/_/g, ' ');
            appendValue(item, itemLabel, depth + 1);
          });
          return;
        }
        if (value !== null && value !== undefined && value !== '') {
          addLine(`${'  '.repeat(Math.min(depth, 3))}${label ? `${label}: ` : ''}${value}`);
        }
      };

      addLine(title, 18, true, 8);
      if (projectName) addLine(`Project: ${projectName}`, 12, true, 8);
      addLine(`Generated: ${new Date().toLocaleString()}`, 9, false, 8);
      appendValue(response, 'Report');
      pdf.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
      showNotice(`${title} generated successfully.`);
    } catch (error) {
      showNotice(error.message || 'Unable to generate report.');
    }
  };

  const deleteProject = async (id) => {
    if (!isAdmin) return;
    const project = projects.find((item) => Number(item.id) === Number(id));
    if (!window.confirm(`Delete project "${project?.name || 'this project'}"? This will also remove its associated project data.`)) return;
    try { await api.deleteProject(id); setProjects((items) => items.filter((p) => Number(p.id) !== Number(id))); showNotice('Project deleted.'); }
    catch (error) { showNotice(error.message); }
  };

  const deleteAsset = async (id) => {
    try { await api.deleteResource(id); setResources((items) => items.filter((r) => r.id !== id)); showNotice('Machinery deleted.'); }
    catch (error) { showNotice(error.message); }
  };

  const deleteMaterial = async (id) => {
    try { await api.deleteInventory(id); setInventory((items) => items.filter((m) => m.id !== id)); showNotice('Material deleted.'); }
    catch (error) { showNotice(error.message); }
  };

  const deleteOrder = async (id) => {
    try { await api.deleteProcurement(id); setOrders((items) => items.filter((o) => o.id !== id)); showNotice('Order deleted.'); }
    catch (error) { showNotice(error.message); }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const updatedOrder = await api.updateProcurementStatus(id, status);
      setOrders((items) => items.map((order) => Number(order.id) === Number(id)
        ? { ...order, ...updatedOrder }
        : order));
      showNotice(`Order ${status.toLowerCase()} successfully.`);
    } catch (error) {
      showNotice(error.message);
    }
  };

  const deleteDocument = async (id) => {
    try { await api.deleteDocument(id); setDocuments((items) => items.filter((d) => d.id !== id)); showNotice('Document deleted.'); }
    catch (error) { showNotice(error.message); }
  };

  const PROJECT_CATEGORIES = [...new Set(projects.map((p) => p.category).filter(Boolean))];
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: Activity },
    { id: 'projects', label: `Projects (${projects.length})`, icon: FolderKanban },
    { id: 'workforce', label: 'Workforce', icon: Users },
    { id: 'attendance', label: isPM ? 'Attendance' : 'Attendance Management', icon: CalendarCheck },
    { id: 'phases', label: 'Timeline Progress', icon: SlidersHorizontal },
    { id: 'resources', label: 'Machinery & Fleet', icon: Truck },
    { id: 'inventory', label: 'Materials & Inventory', icon: Layers },
    { id: 'procurement', label: 'Procurement Orders', icon: ShoppingCart },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'documents', label: 'Document Management', icon: FolderOpen },
    { id: 'profile', label: 'Manager Profile', icon: UserCheck },
  ].filter((item) => roleTabs.has(item.id));

  useEffect(() => {
    if (!roleTabs.has(activeTab)) setActiveTab('overview');
  }, [roleTabs, activeTab]);

  return (
    <div className="min-h-screen w-full bg-[#fcfcfb] text-black flex font-sans">
      {loadError && (
        <div role="alert" className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-[min(90vw,48rem)] rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">{loadError}</div>
      )}
      {loading && (
        <div className="fixed top-3 right-4 z-50 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2 text-xs font-semibold text-gray-700">Loading your workspace...</div>
      )}

      {/* SIDEBAR */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 w-56 h-screen shrink-0 bg-white border-r border-gray-200 p-4 flex-col justify-between overflow-y-auto">

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
            {profile?.name || currentUser?.name || '—'}
          </p>

          <p className="text-[10px] text-yellow-700 font-bold">
            {profile?.role || currentUser?.role || '—'}
          </p>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 min-w-0 md:ml-56">

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
                {profile?.name || currentUser?.name || '—'}
              </p>

              <span className="text-[10px] bg-yellow-100 px-2 py-1 rounded font-bold">
                {profile?.role || currentUser?.role || '—'}
              </span>
            </div>

            <button
              onClick={() => onLogout?.()}
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

              {(isClient || (isSiteEngineer && projects.length === 0)) && (
                <div className="bg-white border rounded-2xl p-6 shadow-sm">
                  <p className="font-black">
                    {isClient
                      ? 'No project has been assigned to you yet.'
                      : 'No active project assignment was found. Ask your Project Manager to assign your Site Engineer account to a project.'}
                  </p>
                </div>
              )}

              {isWorker && (
                <section className="bg-white border rounded-2xl p-6 shadow-sm">
                  <h3 className="font-black text-lg">My Project Work</h3>
                  <p className="text-sm text-gray-500 mt-1">Projects, assigned work role, and assignment dates.</p>
                  {workforceAllocations.length ? (
                    <div className="grid gap-4 mt-4 md:grid-cols-2">
                      {workforceAllocations.map((allocation) => {
                        const project = projects.find((item) => Number(item.id) === Number(allocation.project_id));
                        return (
                          <article key={allocation.id} className="border rounded-xl p-4">
                            <h4 className="font-black">{project?.name || `Project #${allocation.project_id}`}</h4>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm">
                              <dt className="text-gray-500">Assigned work</dt>
                              <dd className="font-semibold text-right">{allocation.role || '—'}</dd>
                              <dt className="text-gray-500">From</dt>
                              <dd className="text-right">{allocation.start_date ? String(allocation.start_date).slice(0, 10) : '—'}</dd>
                              <dt className="text-gray-500">To</dt>
                              <dd className="text-right">{allocation.end_date ? String(allocation.end_date).slice(0, 10) : 'No end date'}</dd>
                              <dt className="text-gray-500">Assignment status</dt>
                              <dd className="text-right">{allocation.status || '—'}</dd>
                            </dl>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-4">No project work has been assigned to your account yet.</p>
                  )}
                </section>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                  <p className="text-xs text-gray-500 font-bold">
                    Total Projects
                  </p>

                  <p className="text-3xl font-black mt-2">
                    {projects.length}
                  </p>
                </div>

                {!isAdmin && (
                  <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold">
                      Attendance
                    </p>

                    <p className="text-3xl font-black mt-2">
                      {attendanceRate}%
                    </p>
                  </div>
                )}


                {!isSiteEngineer && !isWorker && (
                  <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold">
                      Procurement Orders
                    </p>

                    <p className="text-3xl font-black mt-2">
                      {orders.length}
                    </p>
                  </div>
                )}

              </div>

              {!isWorker && (
                <div className="bg-white border rounded-2xl p-6 shadow-sm">

                  <div className="flex justify-between mb-2">
                    <span className="font-black">
                      Overall Project Progress
                    </span>

                    <span className="font-black text-yellow-700">
                      {totalProgress === null ? '—' : `${totalProgress}%`}
                    </span>
                  </div>

                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: `${totalProgress ?? 0}%`,
                      }}
                    />
                  </div>

                </div>
              )}

              {!isSiteEngineer && !isWorker && (
                <div className="bg-white border rounded-2xl p-6 shadow-sm">

                  <h3 className="font-black mb-4">
                    Quick Summary
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                  {!isAdmin && (
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className="border rounded-xl p-4 hover:bg-yellow-50 text-left"
                    >
                      <Users className="w-5 h-5 mb-2" />
                      <p className="font-bold">Attendance</p>
                      <p className="text-xs text-gray-500">{presentCount} Present</p>
                    </button>
                  )}

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
              )}

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

                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingProjectId(null);
                      setProjectForm({ name: '', category: '', location: '', budget: '' });
                      setOpenProjectModal(true);
                    }}
                    className="bg-yellow-400 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Project
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {projects.length === 0 && (
                  <div className="md:col-span-2 bg-white border rounded-2xl p-8 text-center text-sm text-gray-500">
                    {isPM ? 'No projects created by you yet.' : 'No projects available.'}
                  </div>
                )}

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

                        {isPM ? (
                          <button
                            onClick={() => {
                              setSelectedProjectId(String(project.id));
                              setActiveTab('phases');
                            }}
                            className="font-black text-left hover:text-yellow-700"
                          >
                            {project.name}
                          </button>
                        ) : (
                          <h3 className="font-black">{project.name}</h3>
                        )}
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
                      <div>
                        <p className="text-xs text-gray-400">
                          Project Manager
                        </p>
                        {projectManagers.find((manager) => Number(manager.id) === Number(project.manager_id))?.name || '—'}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="mt-5 flex justify-end gap-2 border-t pt-4">
                        <button
                          onClick={() => startProjectEdit(project)}
                          className="border rounded-lg px-3 py-2 text-xs font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="border border-red-200 text-red-600 rounded-lg px-3 py-2 text-xs font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    )}

                  </div>
                ))}

              </div>
            </div>
          )}

          {/* WORKFORCE */}
          {activeTab === 'workforce' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black">Workforce</h2>
                <p className="text-sm text-gray-500">Manage workers, project assignments, shifts and payroll.</p>
                {isPM && (
                  <button onClick={() => setActiveTab('attendance')} className="mt-3 bg-yellow-400 px-4 py-2 rounded-xl text-sm font-black">
                    Workforce Attendance
                  </button>
                )}
              </div>

              {(isAdmin || isPM) && (
                <div className="grid md:grid-cols-4 gap-3">
                  {isPM && <button onClick={() => { setAllocationUserType('Worker'); setOpenAllocationModal(true); }} className="bg-yellow-400 px-4 py-3 rounded-xl font-black">Add Worker / Site Engineer</button>}
                  <button onClick={() => setOpenShiftModal(true)} className="bg-yellow-400 px-4 py-3 rounded-xl font-black">Shift Scheduling</button>
                  <button onClick={() => setOpenPayrollModal(true)} className="bg-yellow-400 px-4 py-3 rounded-xl font-black">Add Payroll</button>
                </div>
              )}

              {isAdmin && (
                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="font-black">Assign Project to Project Manager</h3>
                    <p className="text-xs text-gray-500 mt-1">Choose a project manager for each project.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Project</th><th className="p-3">Status</th><th className="p-3">Project Manager</th><th className="p-3">Action</th></tr></thead><tbody>
                    {projects.length === 0 ? <tr><td colSpan="4" className="p-6 text-center text-gray-500">No projects available.</td></tr> : projects.map((project) => <tr key={project.id} className="border-b last:border-b-0"><td className="p-3 font-bold">{project.name}</td><td className="p-3">{project.status}</td><td className="p-3"><select value={project._selected_manager_id ?? project.manager_id ?? ''} onChange={(e) => setProjects((items) => items.map((item) => item.id === project.id ? { ...item, _selected_manager_id: e.target.value } : item))} className="border rounded-lg px-3 py-2 w-full max-w-xs"><option value="">Select Project Manager</option>{projectManagers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name} ({manager.email})</option>)}</select></td><td className="p-3"><button onClick={() => assignProjectManager(project)} className="bg-yellow-400 px-4 py-2 rounded-xl text-xs font-black">Assign</button></td></tr>)}
                    </tbody></table>
                  </div>
                </div>
              )}

              {isPM && (
                <div className="bg-white border rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4"><h3 className="font-black">Workers</h3><span className="text-xs text-gray-500">{workers.length} workers</span></div>
                  {workers.length === 0 ? <p className="text-sm text-gray-500">No workers available.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Worker</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Status</th></tr></thead><tbody>{workers.map((worker) => <tr key={worker.id} className="border-b last:border-b-0"><td className="p-3 font-bold">{worker.name}</td><td className="p-3">{worker.email}</td><td className="p-3">{worker.phone || '—'}</td><td className="p-3">{worker.is_active ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></div>}
                </div>
              )}

              {isPM && <div className="bg-white border rounded-2xl p-5 shadow-sm"><h3 className="font-black mb-4">Worker Allocation to Project</h3>{workforceAllocations.length === 0 ? <p className="text-sm text-gray-500">No workforce allocations available.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Worker ID</th><th className="p-3">Project ID</th><th className="p-3">Role</th><th className="p-3">Start</th><th className="p-3">Status</th></tr></thead><tbody>{workforceAllocations.map((a) => <tr key={a.id} className="border-b last:border-b-0"><td className="p-3">{a.worker_id}</td><td className="p-3">{a.project_id}</td><td className="p-3">{a.role || '—'}</td><td className="p-3">{a.start_date || '—'}</td><td className="p-3">{a.status || '—'}</td></tr>)}</tbody></table></div>}</div>}

              {(isPM || isAdmin) && <div className="grid lg:grid-cols-2 gap-5"><div className="bg-white border rounded-2xl p-5 shadow-sm"><h3 className="font-black mb-4">Shift Scheduling</h3>{shifts.length === 0 ? <p className="text-sm text-gray-500">No shifts scheduled.</p> : <div className="space-y-2">{shifts.map((s) => <div key={s.id} className="border rounded-xl p-3"><p className="font-bold">{s.shift_name}</p><p className="text-xs text-gray-500">Project: {s.project_id} · {s.shift_date} · {s.start_time} - {s.end_time}</p></div>)}</div>}</div><div className="bg-white border rounded-2xl p-5 shadow-sm"><h3 className="font-black mb-4">Payroll</h3>{payroll.length === 0 ? <p className="text-sm text-gray-500">No payroll records available.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Worker</th><th className="p-3">Period</th><th className="p-3">Net Pay</th><th className="p-3">Status</th></tr></thead><tbody>{payroll.map((p) => <tr key={p.id} className="border-b last:border-b-0"><td className="p-3">{p.worker_id}</td><td className="p-3">{p.pay_period_start} - {p.pay_period_end}</td><td className="p-3">{p.net_pay}</td><td className="p-3">{p.payment_status}</td></tr>)}</tbody></table></div>}</div></div>}

              {isPM && openAllocationModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                  <form onSubmit={addWorkforceAllocation} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
                    <h3 className="text-xl font-black">Add to Project</h3>
                    <select
                      required
                      value={allocationUserType}
                      onChange={(event) => {
                        setAllocationUserType(event.target.value);
                        setAllocationForm({ ...allocationForm, worker_id: '', role: event.target.value === 'Site Engineer' ? 'Site Engineer' : '' });
                      }}
                      className="w-full border rounded-lg p-3"
                    >
                      <option value="Worker">Worker</option>
                      <option value="Site Engineer">Site Engineer</option>
                    </select>
                    <select
                      required
                      value={allocationForm.project_id}
                      onChange={(event) => setAllocationForm({ ...allocationForm, project_id: event.target.value, worker_id: '' })}
                      className="w-full border rounded-lg p-3"
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                    </select>
                    <select
                      required
                      value={allocationForm.worker_id}
                      onChange={(event) => setAllocationForm({ ...allocationForm, worker_id: event.target.value })}
                      className="w-full border rounded-lg p-3"
                    >
                      <option value="">Select existing {allocationUserType}</option>
                      {(allocationUserType === 'Site Engineer' ? availableSiteEngineers : availableWorkers)
                        .filter((user) => user.is_active !== false && !workforceAllocations.some((allocation) =>
                          Number(allocation.worker_id) === Number(user.id) &&
                          Number(allocation.project_id) === Number(allocationForm.project_id) &&
                          String(allocation.status || '').toUpperCase() === 'ACTIVE'
                        ))
                        .map((user) => (
                          <option key={user.id} value={user.id}>{user.name}{user.email ? ` (${user.email})` : ''}</option>
                        ))}
                    </select>
                    {allocationUserType === 'Site Engineer' ? (
                      <p className="text-xs text-gray-500">The engineer will be assigned to this project and will be able to view its allocated workers’ attendance.</p>
                    ) : (
                      <input required placeholder="Workforce Role" value={allocationForm.role} onChange={(event) => setAllocationForm({ ...allocationForm, role: event.target.value })} className="w-full border rounded-lg p-3" />
                    )}
                    <input required type="date" value={allocationForm.start_date} onChange={(event) => setAllocationForm({ ...allocationForm, start_date: event.target.value })} className="w-full border rounded-lg p-3" />
                    <input type="date" value={allocationForm.end_date} onChange={(event) => setAllocationForm({ ...allocationForm, end_date: event.target.value })} className="w-full border rounded-lg p-3" />
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setOpenAllocationModal(false)} className="border px-4 py-2 rounded-lg">Cancel</button>
                      <button className="bg-yellow-400 px-4 py-2 rounded-lg font-black">Add {allocationUserType}</button>
                    </div>
                  </form>
                </div>
              )}

              {openShiftModal && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"><form onSubmit={addShift} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3"><h3 className="text-xl font-black">Shift Scheduling</h3><select required value={shiftForm.project_id} onChange={e=>setShiftForm({...shiftForm,project_id:e.target.value})} className="w-full border rounded-lg p-3"><option value="">Select Project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input required placeholder="Shift Name" value={shiftForm.shift_name} onChange={e=>setShiftForm({...shiftForm,shift_name:e.target.value})} className="w-full border rounded-lg p-3"/><input required type="date" value={shiftForm.shift_date} onChange={e=>setShiftForm({...shiftForm,shift_date:e.target.value})} className="w-full border rounded-lg p-3"/><div className="grid grid-cols-2 gap-2"><input required type="time" value={shiftForm.start_time} onChange={e=>setShiftForm({...shiftForm,start_time:e.target.value})} className="w-full border rounded-lg p-3"/><input required type="time" value={shiftForm.end_time} onChange={e=>setShiftForm({...shiftForm,end_time:e.target.value})} className="w-full border rounded-lg p-3"/></div><div className="flex gap-2 justify-end"><button type="button" onClick={()=>setOpenShiftModal(false)} className="border px-4 py-2 rounded-lg">Cancel</button><button className="bg-yellow-400 px-4 py-2 rounded-lg font-black">Schedule Shift</button></div></form></div>}

              {openPayrollModal && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"><form onSubmit={addPayroll} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3"><h3 className="text-xl font-black">Add Payroll</h3><select required value={payrollForm.worker_id} onChange={e=>setPayrollForm({...payrollForm,worker_id:e.target.value})} className="w-full border rounded-lg p-3"><option value="">Select Worker</option>{workers.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select><select value={payrollForm.project_id} onChange={e=>setPayrollForm({...payrollForm,project_id:e.target.value})} className="w-full border rounded-lg p-3"><option value="">No Project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="grid grid-cols-2 gap-2"><input required type="date" value={payrollForm.pay_period_start} onChange={e=>setPayrollForm({...payrollForm,pay_period_start:e.target.value})} className="w-full border rounded-lg p-3"/><input required type="date" value={payrollForm.pay_period_end} onChange={e=>setPayrollForm({...payrollForm,pay_period_end:e.target.value})} className="w-full border rounded-lg p-3"/></div><div className="grid grid-cols-2 gap-2"><input required type="number" placeholder="Days Worked" value={payrollForm.days_worked} onChange={e=>setPayrollForm({...payrollForm,days_worked:e.target.value})} className="w-full border rounded-lg p-3"/><input required type="number" placeholder="Daily Wage" value={payrollForm.daily_wage} onChange={e=>setPayrollForm({...payrollForm,daily_wage:e.target.value})} className="w-full border rounded-lg p-3"/></div><div className="grid grid-cols-2 gap-2"><input type="number" placeholder="Overtime" value={payrollForm.overtime} onChange={e=>setPayrollForm({...payrollForm,overtime:e.target.value})} className="w-full border rounded-lg p-3"/><input type="number" placeholder="Deductions" value={payrollForm.deductions} onChange={e=>setPayrollForm({...payrollForm,deductions:e.target.value})} className="w-full border rounded-lg p-3"/></div><div className="flex gap-2 justify-end"><button type="button" onClick={()=>setOpenPayrollModal(false)} className="border px-4 py-2 rounded-lg">Cancel</button><button className="bg-yellow-400 px-4 py-2 rounded-lg font-black">Add Payroll</button></div></form></div>}
            </div>
          )}

          {/* ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-5">

              <div>
                <h2 className="text-2xl font-black">
                  {isPM ? 'Workforce Attendance' : 'Attendance'}
                </h2>

                <p className="text-sm text-gray-500">
                  {isPM ? 'Attendance for workers allocated to your projects' : 'View your attendance records'}
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-xs text-gray-500">
                    Attendance Records
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

              <div className="bg-white border rounded-2xl p-5">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="font-black">Search Attendance</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Search by worker name, ID, project, date or status.
                    </p>
                  </div>

                  <input
                    type="text"
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                    placeholder="Search employee..."
                    className="w-full md:w-80 border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-yellow-300"
                  />
                </div>

              </div>
              {isSiteEngineer && (
                <div className="bg-white border rounded-2xl p-5">
                  <label className="block text-xs font-bold text-gray-600">
                    Project
                    <select
                      value={attendanceProjectId}
                      onChange={(event) => setAttendanceProjectId(event.target.value)}
                      className="mt-2 w-full md:w-96 border rounded-xl px-4 py-3 text-sm font-normal"
                    >
                      <option value="">Select project</option>
                      {projects
                        .filter((project) => workforceAllocations.some((allocation) =>
                          Number(allocation.project_id) === Number(project.id) &&
                          String(allocation.status || '').trim().toUpperCase() === 'ACTIVE'
                        ))
                        .map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                    </select>
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    {projects.length
                      ? 'Only workers actively allocated to the selected project are listed.'
                      : 'No active project assignment was found. Ask your Project Manager to add your Site Engineer account to the project, then refresh this page.'}
                  </p>
                </div>
              )}

              <div className="bg-white border rounded-2xl overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 text-left">
                        Worker
                      </th>
                      <th className="p-4 text-left">Project(s)</th>
                      <th className="p-4 text-left">
                        Date
                      </th>
                      <th className="p-4 text-left">
                        Status
                      </th>
                      <th className="p-4 text-left">
                        Check-in
                      </th>
                      <th className="p-4 text-left">
                        Check-out
                      </th>
                      {(isPM || isSiteEngineer) && <th className="p-4 text-left">Action</th>}
                    </tr>
                  </thead>

                  <tbody>

                    {displayedFilteredEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="border-b"
                      >

                        <td className="p-4 font-bold">
                          {employee.name}
                        </td>

                        <td className="p-4">
                          {employee.project_names?.join(', ') || '—'}
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
                        <td className="p-4">{employee.check_in || '—'}</td>
                        <td className="p-4">{employee.check_out || '—'}</td>

                        {(isPM || isSiteEngineer) && (
                          <td className="p-4">
                          <div className="flex gap-2">

                            <button
                              onClick={() =>
                                updateAttendance(
                                  employee,
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
                                  employee,
                                  'Absent'
                                )
                              }
                              className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold"
                            >
                              Absent
                            </button>

                            {!isSiteEngineer && (
                              <button
                                onClick={() => updateAttendance(employee, 'Leave')}
                                className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-xs font-bold"
                              >
                                Leave
                              </button>
                            )}
                          </div>
                          </td>
                        )}

                      </tr>
                    ))}

                    {displayedFilteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan={(isPM || isSiteEngineer) ? 7 : 6} className="p-6 text-center text-sm text-gray-500">
                          {isSiteEngineer && !attendanceProjectId
                            ? 'Select a project to see its assigned workers.'
                            : isSiteEngineer && !siteEngineerAttendanceWorkers.length
                              ? 'No active workers are allocated to this project.'
                              : 'No attendance records found.'}
                        </td>
                      </tr>
                    )}

                  </tbody>

                </table>

              </div>
              {isPM && (
                <p className="text-xs text-gray-500">
                  Projects shown reflect each worker’s current project assignments.
                </p>
              )}
              {isSiteEngineer && (
                <p className="text-xs text-gray-500">
                  Workers shown are limited to projects assigned to your Site Engineer account and actively allocated workers within the selected project.
                </p>
              )}
            </div>
          )}

          {/* TIMELINE */}
          {activeTab === 'phases' && (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black">{isPM ? 'Project Details · Milestones' : 'Timeline Progress'}</h2>
                </div>
                {isSiteEngineer && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedProjectId}
                      onChange={(event) => {
                        setSelectedProjectId(event.target.value);
                        setEditingMilestoneId(null);
                        setOpenMilestoneForm(false);
                      }}
                      className="border rounded-xl px-3 py-2 text-sm"
                      aria-label="Select a project"
                    >
                      <option value="">All projects</option>
                      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={startMilestoneCreation}
                      disabled={!projects.length}
                      className="bg-yellow-400 px-4 py-2 rounded-xl text-sm font-black disabled:opacity-50"
                    >
                      <Plus className="inline w-4 h-4 mr-1" /> Add Milestone
                    </button>
                  </div>
                )}
              </div>
              {isSiteEngineer && (
                <p className="text-xs text-gray-500">
                  Projects and milestones are limited to projects assigned to your Site Engineer account.
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border rounded-2xl p-5"><p className="text-xs text-gray-500 font-bold">Milestones</p><p className="text-3xl font-black mt-2">{displayedPhases.length}</p></div>
                <div className="bg-white border rounded-2xl p-5"><p className="text-xs text-gray-500 font-bold">Average Completion</p><p className="text-3xl font-black mt-2">{displayedProgress === null ? '—' : `${displayedProgress}%`}</p></div>
                <div className="bg-white border rounded-2xl p-5"><p className="text-xs text-gray-500 font-bold">Completed</p><p className="text-3xl font-black mt-2">{displayedPhases.filter((p) => String(p.status || '').toLowerCase() === 'completed' || Number(p.completion_pct) === 100).length}</p></div>
              </div>

              {isSiteEngineer && openMilestoneForm && milestoneForm.project_id && (
                <form onSubmit={saveMilestone} className="bg-white border rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black">{editingMilestoneId ? 'Edit Milestone' : 'Add Milestone'}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMilestoneId(null);
                        setOpenMilestoneForm(false);
                        setMilestoneForm({ ...milestoneForm, project_id: selectedProjectId || milestoneForm.project_id, name: '', description: '', due_date: '', completed_date: '', status: 'Pending', completion_pct: '0' });
                      }}
                      className="text-xs text-gray-500 font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {!editingMilestoneId && (
                      <label className="text-xs font-bold text-gray-600">
                        Project
                        <select required value={milestoneForm.project_id} onChange={(event) => setMilestoneForm({ ...milestoneForm, project_id: event.target.value })} className="mt-1 w-full border rounded-xl p-3 text-sm font-normal">
                          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                        </select>
                      </label>
                    )}
                    {editingMilestoneId && <p className="text-xs text-gray-500 md:col-span-2">Project: {projects.find((project) => Number(project.id) === Number(milestoneForm.project_id))?.name || '—'}</p>}
                    <label className="text-xs font-bold text-gray-600">
                      Name
                      <input required value={milestoneForm.name} onChange={(event) => setMilestoneForm({ ...milestoneForm, name: event.target.value })} className="mt-1 w-full border rounded-xl p-3 text-sm font-normal" />
                    </label>
                    <label className="text-xs font-bold text-gray-600">
                      Status
                      <input required value={milestoneForm.status} onChange={(event) => setMilestoneForm({ ...milestoneForm, status: event.target.value })} className="mt-1 w-full border rounded-xl p-3 text-sm font-normal" />
                    </label>
                    <label className="text-xs font-bold text-gray-600">
                      Due date
                      <input type="date" value={milestoneForm.due_date} onChange={(event) => setMilestoneForm({ ...milestoneForm, due_date: event.target.value })} className="mt-1 w-full border rounded-xl p-3 text-sm font-normal" />
                    </label>
                    <label className="text-xs font-bold text-gray-600">
                      Completed date
                      <input type="date" value={milestoneForm.completed_date} onChange={(event) => setMilestoneForm({ ...milestoneForm, completed_date: event.target.value })} className="mt-1 w-full border rounded-xl p-3 text-sm font-normal" />
                    </label>
                    <label className="text-xs font-bold text-gray-600">
                      Completion (%)
                      <input type="number" min="0" max="100" value={milestoneForm.completion_pct} onChange={(event) => setMilestoneForm({ ...milestoneForm, completion_pct: event.target.value })} className="mt-1 w-full border rounded-xl p-3 text-sm font-normal" />
                    </label>
                    <label className="text-xs font-bold text-gray-600 md:col-span-2">
                      Description
                      <textarea value={milestoneForm.description} onChange={(event) => setMilestoneForm({ ...milestoneForm, description: event.target.value })} rows={3} className="mt-1 w-full border rounded-xl p-3 text-sm font-normal" />
                    </label>
                  </div>
                  <button type="submit" className="bg-yellow-400 px-5 py-2 rounded-xl text-sm font-black">
                    {editingMilestoneId ? 'Save Changes' : 'Create Milestone'}
                  </button>
                </form>
              )}

              {displayedPhases.length === 0 ? (
                <div className="bg-white border rounded-2xl p-8 text-center text-sm text-gray-500">No milestones to display.</div>
              ) : (
                displayedPhases.map((phase) => {
                  const project = projects.find((p) => Number(p.id) === Number(phase.project_id));
                  const pct = Math.max(0, Math.min(100, Number(phase.completion_pct || 0)));
                  return (
                    <div key={phase.id} className="bg-white border rounded-2xl p-5">
                      <div className="flex justify-between gap-5">
                        <div className="min-w-0">
                          <h3 className="font-black">{phase.name || 'Milestone'}</h3>
                          <p className="text-xs font-semibold text-gray-500 mt-1">Project: {project?.name || `Project #${phase.project_id}`}</p>
                          {phase.description && <p className="text-sm text-gray-500 mt-2">{phase.description}</p>}
                        </div>
                        <span className="font-black text-yellow-700 whitespace-nowrap">{pct}%</span>
                      </div>
                      <div className="mt-4 h-3 w-full rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                        <div><p className="text-gray-400">Status</p><p className="font-bold">{phase.status || '-'}</p></div>
                        <div><p className="text-gray-400">Due date</p><p className="font-bold">{phase.due_date || '-'}</p></div>
                        <div><p className="text-gray-400">Completed date</p><p className="font-bold">{phase.completed_date || '-'}</p></div>
                      </div>
                      {isSiteEngineer && (
                        <div className="mt-4 flex gap-2">
                          <button type="button" onClick={() => editMilestone(phase.id)} className="border rounded-lg px-3 py-2 text-xs font-bold">Edit</button>
                          <button type="button" onClick={() => deleteMilestone(phase)} className="text-red-600 border border-red-200 rounded-lg px-3 py-2 text-xs font-bold">Delete</button>
                        </div>
                      )}
                      {isSiteEngineer && (
                        <div className="mt-5"><label className="text-xs font-bold text-gray-500">Update completion</label><input type="range" min="0" max="100" value={pct} onChange={(e) => updatePhase(phase.id, e.target.value)} className="w-full mt-2 accent-yellow-400" /></div>
                      )}
                    </div>
                  );
                })
              )}
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

                {(isPM || isAdmin) && (
                  <button
                    onClick={() => setOpenAssetModal(true)}
                    className="bg-yellow-400 px-4 py-2 rounded-xl font-black text-sm flex gap-2 items-center"
                  >
                    <Plus className="w-4 h-4" />
                    Add Asset
                  </button>
                )}
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
                        Status
                      </th>
                      {isAdmin && <th className="p-4 text-left">Project</th>}
                      {isPM && <th className="p-4 text-left">
                        Action
                      </th>}
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

                        <td className="p-4">
                          {resource.status}
                        </td>

                        {isAdmin && (
                          <td className="p-4">
                            {projects.find((project) => Number(project.id) === Number(resource.project_id))?.name || 'Shared / Unassigned'}
                          </td>
                        )}

                        {isPM && (
                          <td className="p-4">
                            <button onClick={() => deleteAsset(resource.id)} className="text-red-600 font-bold text-xs">Delete</button>
                          </td>
                        )}

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

                {(isPM || isAdmin) && (
                  <button
                    onClick={() => setOpenMaterialModal(true)}
                    className="bg-yellow-400 px-4 py-2 rounded-xl font-black text-sm flex gap-2 items-center"
                  >
                    <Plus className="w-4 h-4" />
                    Add Material
                  </button>
                )}

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
                      {isAdmin && <th className="p-4 text-left">Project</th>}
                      {isPM && <th className="p-4 text-left">
                        Action
                      </th>}
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

                        {isAdmin && (
                          <td className="p-4">
                            {projects.find((project) => Number(project.id) === Number(item.project_id))?.name || 'Shared / Unassigned'}
                          </td>
                        )}

                        {isPM && (
                          <td className="p-4">
                            <button onClick={() => deleteMaterial(item.id)} className="text-red-600 font-bold text-xs">Delete</button>
                          </td>
                        )}

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

                {isPM && (
                  <button
                    onClick={() => setOpenOrderModal(true)}
                    className="bg-yellow-400 px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Order
                  </button>
                )}

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

                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        order.status === 'APPROVED' ? 'bg-green-100 text-green-700'
                          : order.status === 'REJECTED' ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
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

                    <p className="mt-3 text-xs text-gray-500">
                      Project: {order.project_name || projects.find((project) => Number(project.id) === Number(order.project_id))?.name || '—'}
                    </p>

                    {isAdmin && order.status === 'REQUESTED' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(order.id, 'APPROVED')}
                          className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(order.id, 'REJECTED')}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {isPM && (
                      <button onClick={() => deleteOrder(order.id)} className="mt-4 text-red-600 text-xs font-bold">Delete Order</button>
                    )}

                  </div>
                ))}

              </div>

            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black">Notifications</h2>
                <p className="text-sm text-gray-500">View notifications for your account and send notifications to eligible workers.</p>
              </div>

              {(isAdmin || isPM) && !showNotificationForm && (
                <button
                  type="button"
                  onClick={() => setShowNotificationForm(true)}
                  className="bg-yellow-400 px-5 py-3 rounded-xl text-sm font-black flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Notification
                </button>
              )}

              {(isAdmin || isPM) && showNotificationForm && (
                <form onSubmit={createNotification} className="bg-white border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black">Create Notification</h3>
                    <button
                      type="button"
                      onClick={() => setShowNotificationForm(false)}
                      className="border px-3 py-1.5 rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                  {isPM && (
                    <label className="block text-xs font-bold text-gray-600">
                      Project
                      <select
                        required
                        value={notificationForm.project_id}
                        onChange={(event) => {
                          setNotificationForm({ ...notificationForm, project_id: event.target.value, user_ids: [] });
                          setNotificationRecipientId('');
                          setNotificationSendToAll(false);
                        }}
                        className="mt-1 w-full border rounded-xl p-3 text-sm font-normal"
                      >
                        <option value="">Select one of your projects</option>
                        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                      </select>
                    </label>
                  )}
                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-gray-600 md:col-span-2">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSendToAll}
                          onChange={(event) => {
                            setNotificationSendToAll(event.target.checked);
                            setNotificationForm({ ...notificationForm, user_ids: [] });
                            setNotificationRecipientId('');
                          }}
                          disabled={isPM && !notificationForm.project_id}
                          className="accent-yellow-400"
                        />
                        Send to all eligible workers
                      </span>
                    </label>
                    <label className="text-xs font-bold text-gray-600 md:col-span-2">
                      Worker email
                      <select
                        value={notificationRecipientId}
                        onChange={(event) => setNotificationRecipientId(event.target.value)}
                        disabled={notificationSendToAll || (isPM && !notificationForm.project_id)}
                        className="mt-1 w-full border rounded-xl p-3 text-sm font-normal disabled:bg-gray-50"
                      >
                        <option value="">Select a worker email</option>
                        {notificationRecipientWorkers.map((worker) => <option key={worker.id} value={worker.id}>{worker.email}</option>)}
                      </select>
                      <button
                        type="button"
                        disabled={notificationSendToAll || !notificationRecipientId || notificationForm.user_ids.includes(notificationRecipientId)}
                        onClick={() => {
                          setNotificationForm({
                            ...notificationForm,
                            user_ids: [...notificationForm.user_ids, notificationRecipientId],
                          });
                          setNotificationRecipientId('');
                        }}
                        className="mt-2 border rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                      >
                        Add recipient
                      </button>
                      {!notificationSendToAll && notificationForm.user_ids.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {notificationForm.user_ids.map((userId) => {
                            const worker = notificationRecipientWorkers.find((item) => Number(item.id) === Number(userId));
                            if (!worker) return null;
                            return (
                              <span key={userId} className="inline-flex items-center gap-2 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-xs font-semibold">
                                {worker.email}
                                <button
                                  type="button"
                                  aria-label={`Remove ${worker.email}`}
                                  onClick={() => setNotificationForm({
                                    ...notificationForm,
                                    user_ids: notificationForm.user_ids.filter((id) => id !== userId),
                                  })}
                                  className="font-black"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {isPM && notificationForm.project_id && notificationRecipientWorkers.length === 0 && (
                        <span className="mt-1 block font-normal text-gray-500">No active workers are allocated to this project.</span>
                      )}
                    </label>
                    <label className="text-xs font-bold text-gray-600">
                      Title
                      <input required value={notificationForm.title} onChange={(event) => setNotificationForm({ ...notificationForm, title: event.target.value })} className="mt-1 w-full border rounded-xl p-3 text-sm font-normal" />
                    </label>
                    <label className="text-xs font-bold text-gray-600">
                      Notification type
                      <input required value={notificationForm.notification_type} onChange={(event) => setNotificationForm({ ...notificationForm, notification_type: event.target.value })} className="mt-1 w-full border rounded-xl p-3 text-sm font-normal" />
                    </label>
                    <label className="text-xs font-bold text-gray-600 md:col-span-2">
                      Message
                      <textarea required value={notificationForm.message} onChange={(event) => setNotificationForm({ ...notificationForm, message: event.target.value })} rows={3} className="mt-1 w-full border rounded-xl p-3 text-sm font-normal" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    {isPM
                      ? 'Send to selected workers or all active workers assigned to this project.'
                      : 'Send to selected workers or all active workers.'}
                  </p>
                  <button type="submit" className="bg-yellow-400 px-5 py-2 rounded-xl text-sm font-black">Send Notification</button>
                </form>
              )}

              {notifications.length === 0 ? (
                <div className="bg-white border rounded-2xl p-8 text-center text-sm text-gray-500">No notifications available.</div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="bg-white border rounded-2xl p-5">
                      <div className="flex justify-between gap-3">
                        <h3 className="font-black">{notification.title || 'Notification'}</h3>
                        <span className="text-xs text-gray-500">{notification.created_at ? new Date(notification.created_at).toLocaleString() : ''}</span>
                      </div>
                      {notification.notification_type && <p className="mt-1 text-xs font-bold text-yellow-700">{notification.notification_type}</p>}
                      <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{notification.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black">Reports</h2>
                <p className="text-sm text-gray-500">View project and operational reports.</p>
              </div>

              <div className="bg-white border rounded-2xl p-5">
                <label className="text-xs font-bold text-gray-500">Project for project-specific reports</label>
                <select value={reportProjectId} onChange={(e) => setReportProjectId(e.target.value)} className="mt-2 w-full md:w-96 border rounded-xl px-4 py-3 text-sm">
                  <option value="">Select a project</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  ['Attendance Report', 'attendance'],
                  ['Project Progress Report', 'progress'],
                  ['Procurement Report', 'procurement'],
                  ['Resource Report', 'resources'],
                ].map(([title, type]) => (
                  <div key={title} className="bg-white border rounded-2xl p-5">
                    <FileText className="w-7 h-7 text-yellow-600" />
                    <h3 className="font-black mt-3">{title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Choose a project to generate this report.</p>
                    <button
                      onClick={() => generateReport(title, type)}
                      disabled={!reportProjectId}
                      className="mt-4 bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Generate Report
                    </button>
                  </div>
                ))}
              </div>

              {isAdmin && (
                <div className="bg-white border rounded-2xl p-5">
                  <FileText className="w-7 h-7 text-yellow-600" />
                  <h3 className="font-black mt-3">Analytical Report</h3>
                  <p className="text-sm text-gray-500 mt-1">View a summary of project performance and operations.</p>
                  <button onClick={() => generateReport('Analytical Report', 'analytical')} className="mt-4 bg-yellow-400 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2">
                    <Download className="w-4 h-4" /> Generate Report
                  </button>
                </div>
              )}
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
                  Construction operations analytics by project
                </p>
              </div>

              <div className="bg-white border rounded-2xl p-5">
                <label className="block text-xs font-bold text-gray-600">
                  Project
                  <select
                    value={analyticsProject ? String(analyticsProject.id) : ''}
                    onChange={(event) => setAnalyticsProjectId(event.target.value)}
                    className="mt-2 w-full md:w-96 border rounded-xl px-4 py-3 text-sm font-normal"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </label>
                {analyticsProject && (
                  <p className="mt-3 text-sm font-bold">
                    Showing analytics for: <span className="text-yellow-700">{analyticsProject.name}</span>
                  </p>
                )}
              </div>

              {!analyticsProject ? (
                <div className="bg-white border rounded-2xl p-8 text-center text-sm text-gray-500">
                  {projects.length ? 'Select a project to view its analytics.' : 'No projects are available for analytics.'}
                </div>
              ) : (
                <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-xs text-gray-500">
                    Project Completion
                  </p>
                  <p className="text-3xl font-black">
                    {analyticsProjectProgress === null ? '—' : `${analyticsProjectProgress}%`}
                  </p>
                  <div className="h-2 bg-gray-100 rounded mt-3">
                    <div
                      className="h-full bg-yellow-400 rounded"
                      style={{
                        width: `${analyticsProjectProgress ?? 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-xs text-gray-500">
                    Today's Attendance Rate
                  </p>
                  <p className="text-3xl font-black">
                    {analyticsProjectAttendanceRate}%
                  </p>
                  <div className="h-2 bg-gray-100 rounded mt-3">
                    <div
                      className="h-full bg-green-500 rounded"
                      style={{
                        width: `${analyticsProjectAttendanceRate ?? 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-5">
                  <p className="text-xs text-gray-500">
                    Active Orders
                  </p>
                  <p className="text-3xl font-black">
                    {analyticsProjectOrders.length}
                  </p>
                </div>

              </div>

              <div className="bg-white border rounded-2xl p-6">

                <h3 className="font-black mb-5">
                  Project Phase Analytics
                </h3>

                <div className="space-y-5">

                  {analyticsProjectPhases.length ? analyticsProjectPhases.map((phase) => (
                    <div key={phase.id}>

                      <div className="flex justify-between text-sm mb-2">

                        <span className="font-bold">
                          {phase.name}
                        </span>

                        <span className="font-black">
                          {Number(phase.completion_pct || 0)}%
                        </span>

                      </div>

                      <div className="h-5 bg-gray-100 rounded-full overflow-hidden">

                        <div
                          className="h-full bg-yellow-400"
                          style={{
                            width: `${Math.max(0, Math.min(100, Number(phase.completion_pct || 0)))}%`,
                          }}
                        />

                      </div>

                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">No progress updates are available for this project.</p>
                  )}

                </div>

              </div>
                </>
              )}

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
                    accept=".pdf,application/pdf"
                    required
                    onChange={(e) =>
                      setDocFile(
                        e.target.files?.[0] ||
                          null
                      )
                    }
                    className="flex-1 border rounded-xl p-2 text-sm"
                  />

                  <p className="text-xs text-gray-500 md:self-center">
                    Only PDF files are allowed.
                  </p>

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
              <h2 className="text-2xl font-black">Manager Profile</h2>
              <div className="bg-white border rounded-2xl p-6 max-w-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-2xl font-black">{(profile?.name || '').charAt(0).toUpperCase() || '—'}</div>
                  <div><h3 className="text-xl font-black">{profile?.name || '—'}</h3><p className="text-sm text-gray-500">{profile?.role || '—'}</p></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5 mt-6 pt-5 border-t">
                  <div><p className="text-xs text-gray-400">Email</p><p className="font-bold">{profile?.email || '—'}</p></div>
                  <div><p className="text-xs text-gray-400">Phone</p><p className="font-bold">{profile?.phone || '—'}</p></div>
                  <div><p className="text-xs text-gray-400">Role</p><p className="font-bold">{profile?.role || '—'}</p></div>
                  <div><p className="text-xs text-gray-400">Status</p><p className={`font-bold ${profile?.is_active ? 'text-green-600' : 'text-red-600'}`}>{profile?.is_active === true ? 'Active' : profile?.is_active === false ? 'Inactive' : '—'}</p></div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* PROJECT MODAL */}
      {isAdmin && openProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl p-6 w-full max-w-md">

            <div className="flex justify-between mb-5">

              <h3 className="font-black">
                {editingProjectId ? 'Edit Project' : 'Add Project'}
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
                {editingProjectId ? 'Save Changes' : 'Add Project'}
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
                value={assetForm.project_id}
                required={isPM}
                onChange={(e) => setAssetForm({ ...assetForm, project_id: e.target.value })}
                className="w-full border rounded-xl p-3 text-sm"
              >
                <option value="">{isPM ? 'Select project' : 'No project (shared equipment)'}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>

              <select
                required
                value={assetForm.category}
                onChange={(e) =>
                  setAssetForm({
                    ...assetForm,
                    category: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              >
                <option value="">Select machinery category</option>
                {RESOURCE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{formatCategory(category)}</option>
                ))}
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
                value={materialForm.project_id}
                required={isPM}
                onChange={(e) => setMaterialForm({ ...materialForm, project_id: e.target.value })}
                className="w-full border rounded-xl p-3 text-sm"
              >
                <option value="">{isPM ? 'Select project' : 'No project (shared inventory)'}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>

              <select
                required
                value={materialForm.category}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    category: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3 text-sm"
              >
                <option value="">Select material category</option>
                {MATERIAL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{formatCategory(category)}</option>
                ))}
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

              <select
                required
                value={orderForm.project_id}
                onChange={(e) => setOrderForm({ ...orderForm, project_id: e.target.value })}
                className="w-full border rounded-xl p-3 text-sm"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>

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

    </div>
  );
};

export default Dashboard;
