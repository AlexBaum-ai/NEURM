export interface ProfileViewer {
  id: string;
  viewedAt: string;
  anonymous: boolean;
  viewer: {
    username: string;
    displayName: string;
    avatarUrl?: string;
    company?: {
      name: string;
    };
  } | null;
}

export interface ProfileViewsData {
  totalViews: number;
  uniqueViewers: number;
  views: ProfileViewer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ViewCountData {
  totalViews: number;
}

export interface ViewsChartData {
  date: string;
  views: number;
}
