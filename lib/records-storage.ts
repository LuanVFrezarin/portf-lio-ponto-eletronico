const DAILY_RECORDS_KEY = 'ponto_daily_records';
const CORRECTIONS_KEY = 'ponto_corrections';
const JUSTIFICATIONS_KEY = 'ponto_justifications';
const TIMEOFFS_KEY = 'ponto_timeoffs';
const OVERTIMES_KEY = 'ponto_overtimes';
const NOTICES_KEY = 'ponto_notices';

export interface DailyRecord {
  id: string;
  employeeId: string;
  date: string;
  entry?: Date;
  lunchStart?: Date;
  lunchEnd?: Date;
  exit?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CorrectionRequest {
  id: string;
  employeeId: string;
  date: string;
  type: string;
  requestedTime: string;
  reason: string;
  status: string;
  adminComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JustificationRequest {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
  status: string;
  adminComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeOff {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Daily Records
export function getDailyRecords(): DailyRecord[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(DAILY_RECORDS_KEY);
  if (!data) return [];
  return JSON.parse(data).map((r: any) => ({
    ...r,
    entry: r.entry ? new Date(r.entry) : undefined,
    lunchStart: r.lunchStart ? new Date(r.lunchStart) : undefined,
    lunchEnd: r.lunchEnd ? new Date(r.lunchEnd) : undefined,
    exit: r.exit ? new Date(r.exit) : undefined,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));
}

export function getDailyRecord(employeeId: string, date: string): DailyRecord | undefined {
  return getDailyRecords().find(r => r.employeeId === employeeId && r.date === date);
}

export function createOrUpdateDailyRecord(data: Partial<DailyRecord>): DailyRecord {
  if (typeof window === 'undefined') throw new Error('Only works in browser');
  
  const records = getDailyRecords();
  const existing = records.findIndex(r => 
    r.employeeId === data.employeeId && r.date === data.date
  );

  const record: DailyRecord = {
    ...data,
    id: data.id || `record_${Date.now()}`,
    employeeId: data.employeeId || '',
    date: data.date || '',
    createdAt: existing >= 0 ? records[existing].createdAt : new Date(),
    updatedAt: new Date(),
  } as DailyRecord;

  if (existing >= 0) {
    records[existing] = record;
  } else {
    records.push(record);
  }

  localStorage.setItem(DAILY_RECORDS_KEY, JSON.stringify(records));
  return record;
}

// Corrections
export function getCorrectionRequests(): CorrectionRequest[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(CORRECTIONS_KEY);
  if (!data) return [];
  return JSON.parse(data).map((r: any) => ({
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));
}

export function createCorrectionRequest(data: Omit<CorrectionRequest, 'id' | 'createdAt' | 'updatedAt'>): CorrectionRequest {
  if (typeof window === 'undefined') throw new Error('Only works in browser');
  
  const requests = getCorrectionRequests();
  const request: CorrectionRequest = {
    ...data,
    id: `correction_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  requests.push(request);
  localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(requests));
  return request;
}

export function updateCorrectionRequest(id: string, data: Partial<CorrectionRequest>): CorrectionRequest {
  if (typeof window === 'undefined') throw new Error('Only works in browser');
  
  const requests = getCorrectionRequests();
  const index = requests.findIndex(r => r.id === id);
  
  if (index === -1) throw new Error('Request not found');

  requests[index] = {
    ...requests[index],
    ...data,
    id: requests[index].id,
    createdAt: requests[index].createdAt,
    updatedAt: new Date(),
  };

  localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(requests));
  return requests[index];
}

// Justifications
export function getJustificationRequests(): JustificationRequest[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(JUSTIFICATIONS_KEY);
  if (!data) return [];
  return JSON.parse(data).map((r: any) => ({
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));
}

export function createJustificationRequest(data: Omit<JustificationRequest, 'id' | 'createdAt' | 'updatedAt'>): JustificationRequest {
  if (typeof window === 'undefined') throw new Error('Only works in browser');
  
  const requests = getJustificationRequests();
  const request: JustificationRequest = {
    ...data,
    id: `justification_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  requests.push(request);
  localStorage.setItem(JUSTIFICATIONS_KEY, JSON.stringify(requests));
  return request;
}

export function updateJustificationRequest(id: string, data: Partial<JustificationRequest>): JustificationRequest {
  if (typeof window === 'undefined') throw new Error('Only works in browser');
  
  const requests = getJustificationRequests();
  const index = requests.findIndex(r => r.id === id);
  
  if (index === -1) throw new Error('Request not found');

  requests[index] = {
    ...requests[index],
    ...data,
    id: requests[index].id,
    createdAt: requests[index].createdAt,
    updatedAt: new Date(),
  };

  localStorage.setItem(JUSTIFICATIONS_KEY, JSON.stringify(requests));
  return requests[index];
}

// TimeOffs
export function getTimeOffs(): TimeOff[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(TIMEOFFS_KEY);
  if (!data) return [];
  return JSON.parse(data).map((r: any) => ({
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));
}

export function createTimeOff(data: Omit<TimeOff, 'id' | 'createdAt' | 'updatedAt'>): TimeOff {
  if (typeof window === 'undefined') throw new Error('Only works in browser');
  
  const timeoffs = getTimeOffs();
  const timeoff: TimeOff = {
    ...data,
    id: `timeoff_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  timeoffs.push(timeoff);
  localStorage.setItem(TIMEOFFS_KEY, JSON.stringify(timeoffs));
  return timeoff;
}

export function updateTimeOff(id: string, data: Partial<TimeOff>): TimeOff {
  if (typeof window === 'undefined') throw new Error('Only works in browser');
  
  const timeoffs = getTimeOffs();
  const index = timeoffs.findIndex(r => r.id === id);
  
  if (index === -1) throw new Error('TimeOff not found');

  timeoffs[index] = {
    ...timeoffs[index],
    ...data,
    id: timeoffs[index].id,
    createdAt: timeoffs[index].createdAt,
    updatedAt: new Date(),
  };

  localStorage.setItem(TIMEOFFS_KEY, JSON.stringify(timeoffs));
  return timeoffs[index];
}

// Notices
export function getNotices(): Notice[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(NOTICES_KEY);
  if (!data) return [];
  return JSON.parse(data).map((r: any) => ({
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));
}

export function createNotice(data: Omit<Notice, 'id' | 'createdAt' | 'updatedAt'>): Notice {
  if (typeof window === 'undefined') throw new Error('Only works in browser');
  
  const notices = getNotices();
  const notice: Notice = {
    ...data,
    id: `notice_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  notices.push(notice);
  localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
  return notice;
}

export function updateNotice(id: string, data: Partial<Notice>): Notice {
  if (typeof window === 'undefined') throw new Error('Only works in browser');
  
  const notices = getNotices();
  const index = notices.findIndex(r => r.id === id);
  
  if (index === -1) throw new Error('Notice not found');

  notices[index] = {
    ...notices[index],
    ...data,
    id: notices[index].id,
    createdAt: notices[index].createdAt,
    updatedAt: new Date(),
  };

  localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
  return notices[index];
}

export function deleteNotice(id: string): void {
  if (typeof window === 'undefined') return;
  
  const notices = getNotices().filter(r => r.id !== id);
  localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
}
