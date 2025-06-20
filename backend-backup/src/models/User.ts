export interface User {
    id: string;
    email: string;
    fullName: string;
    tenantId: string;
  }
  
  export interface Tenant {
    id: string;
    name: string;
    createdAt: Date;
  }
  