export const fetchAcademicYears = async () => {
  const response = await fetch('/api/academic-years');
  return response.json();
};

export const fetchCourses = async (academicYearId: string) => {
  const response = await fetch(`/api/courses?academic_year=${academicYearId}`);
  return response.json();
};

export const fetchStandards = async (academicYearId: string) => {
  const response = await fetch(`/api/standards?academic_year=${academicYearId}`);
  return response.json();
};

export const fetchPointers = async (standardId: string) => {
  const response = await fetch(`/api/pointers?standard=${standardId}`);
  return response.json();
};

export const fetchElements = async (pointerId: string) => {
  const response = await fetch(`/api/elements?pointer=${pointerId}`);
  return response.json();
};

export const fetchAttachments = async (elementId: string) => {
  const response = await fetch(`/api/attachments?element=${elementId}`);
  return response.json();
};

export const createCourse = async (data: any) => {
  const response = await fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

export const createStandard = async (data: any) => {
  const response = await fetch('/api/standards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

export const createPointer = async (data: any) => {
  const response = await fetch('/api/pointers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

export const createElement = async (data: any) => {
  const response = await fetch('/api/elements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
};

export const createAttachment = async (data: FormData) => {
  const response = await fetch('/api/attachments', {
    method: 'POST',
    body: data
  });
  return response.json();
}; 