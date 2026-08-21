export type CategoryStatus = "active" | "inactive";

export interface Category {
    _id: string;
    name: string;
    status: CategoryStatus;
    createdAt: string;
    updatedAt: string;
}