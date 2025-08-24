// This file's functionality has been removed as per user request.
import type { Address } from "./transactions";

export interface Contact {
    id: string;
    userId: string;
    name: string;
    address: Address;
    type: 'sender' | 'recipient';
}

export type ContactInput = Omit<Contact, 'id'>;
