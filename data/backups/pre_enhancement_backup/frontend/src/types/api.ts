export interface ResearchMetadata {
  title: string;
  dataset: string;
  target_variable: string;
  state: string;
  status: string;
  note: string;
}

export interface ApiResponse<T> {
  success: boolean;
  metadata: ResearchMetadata;
  data: T;
  message?: string;
}
