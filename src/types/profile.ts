// 用户资料相关类型定义

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  phone: string;
  location: string;
  job_title: string;
  job_intention: string;
  skills: string[];
  experience_years: number;
  education: string;
  resume_url: string;
  created_at: string;
  updated_at: string;
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
}

export interface UpdateProfileRequest extends Partial<CreateProfileRequest> {
  id?: string;
}

export interface ProfileFormData {
  full_name: string;
  bio: string;
  phone: string;
  location: string;
  job_title: string;
  job_intention: string;
  skills: string;
  experience_years: number;
  education: string;
}

export interface ProfileApiResponse {
  data: UserProfile | null;
  error?: string;
}
