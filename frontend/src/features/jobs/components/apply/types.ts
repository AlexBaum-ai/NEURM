export interface ApplicationFormData {
  coverLetter: string;
  screeningAnswers: Array<{
    question: string;
    answer: string;
  }>;
}

export interface ApplicationDraft {
  jobSlug: string;
  coverLetter: string;
  screeningAnswers: Array<{
    question: string;
    answer: string;
  }>;
  savedAt: string;
}
