// 用户资料相关类型定义

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  nickname: string; // 新增
  avatar_url: string;
  bio: string;
  phone: string;
  location: string;
  job_title: string;
  job_intention: string;
  company: string; // 新增
  skills: string[];
  experience_years: number;
  education: string; // 将被替换
  school: string; // 新增
  major: string; // 新增
  degree: string; // 新增
  graduation_date: string; // 新增
  resume_url: string;
  created_at: string;
  updated_at: string;
  work_experiences: WorkExperience[]; // 新增
}

export interface WorkExperience {
  // 新增
  id?: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface ProjectExperience {
  project_name: string;
  role: string;
  start_date: string;
  end_date: string;
  tech_stack: string[];
  description: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  nickname: string; // 新增
  avatar_url: string;
  bio: string;
  phone: string;
  location: string;
  job_title: string;
  job_intention: string;
  company: string; // 新增
  skills: string[];
  experience_years: number;
  education: string; // 将被替换
  school: string; // 新增
  major: string; // 新增
  degree: string; // 新增
  graduation_date: string; // 新增
  resume_url: string;
  created_at: string;
  updated_at: string;
  work_experiences: WorkExperience[]; // 新增
  project_experiences: ProjectExperience[];
}

export interface CreateProfileRequest {
  full_name: string;
  bio: string;
  phone: string;
  location: string;
  job_title: string;
  job_intention: string;
  skills: string[];
  experience_years: number;
  education: string;
  nickname: string;
  company: string;
  school: string;
  major: string;
  degree: string;
  graduation_date: string;
  work_experiences: WorkExperience[]; // 新增
  project_experiences: ProjectExperience[];
}

export interface UpdateProfileRequest extends Partial<CreateProfileRequest> {
  id?: string;
}

export interface ProfileFormData {
  full_name: string;
  nickname: string;
  company: string;
  bio: string;
  phone: string;
  location: string;
  job_title: string;
  job_intention: string;
  skills: string;
  experience_years: number;
  education: string;
  school: string;
  major: string;
  degree: string;
  graduation_date: string;
  work_experiences: WorkExperience[]; // 新增
  project_experiences: ProjectExperience[];
}

export interface ProfileApiResponse {
  data: UserProfile | null;
  error?: string;
}
