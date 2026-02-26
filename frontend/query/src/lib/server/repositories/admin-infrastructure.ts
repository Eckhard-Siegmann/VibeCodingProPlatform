/**
 * Admin Infrastructure repository — CRUD for partners, locations, rooms.
 * Spec: Ch.17.4 (Partner/Location/Room Management), Ch.29 (Events and Locations)
 * User stories: A8 (Create Partners), A9 (Manage Locations/Rooms)
 */

import { getDatabase, generateId, nowIso } from '../db';

// ── Types ────────────────────────────────────────────────────────────

export interface PartnerRow {
	partner_id: string;
	name: string;
	logo_url: string | null;
	website_url: string | null;
	contact_name: string | null;
	contact_email: string | null;
	partner_type: string;
	description: string | null;
	created_at: string;
	location_count: number;
	event_count: number;
}

export interface LocationRow {
	location_id: string;
	name: string;
	address: string;
	city: string;
	created_at: string;
	room_count: number;
}

export interface RoomRow {
	room_id: string;
	location_id: string;
	location_name: string;
	name: string;
	max_pax_tables: number;
	max_pax_no_tables: number;
	created_at: string;
}

// ── Partners ─────────────────────────────────────────────────────────

export function listPartners(): PartnerRow[] {
	const db = getDatabase();
	return db.prepare(`
		SELECT
			p.*,
			(SELECT COUNT(*) FROM locations l
			 JOIN rooms r ON r.location_id = l.location_id
			 JOIN events e ON e.room_id = r.room_id
			 WHERE e.partner_id = p.partner_id
			 GROUP BY l.location_id) AS location_count,
			(SELECT COUNT(*) FROM events e WHERE e.partner_id = p.partner_id) AS event_count
		FROM partners p
		ORDER BY p.name ASC
	`).all() as PartnerRow[];
}

export function getPartnerById(partnerId: string): PartnerRow | null {
	const db = getDatabase();
	const row = db.prepare('SELECT * FROM partners WHERE partner_id = ?').get(partnerId);
	return (row as PartnerRow) ?? null;
}

export function createPartner(data: {
	name: string;
	partner_type: string;
	logo_url?: string;
	website_url?: string;
	contact_name?: string;
	contact_email?: string;
	description?: string;
}): string {
	const db = getDatabase();
	const id = generateId();
	const now = nowIso();

	db.prepare(`
		INSERT INTO partners (partner_id, name, logo_url, website_url, contact_name, contact_email, partner_type, description, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		id,
		data.name,
		data.logo_url ?? null,
		data.website_url ?? null,
		data.contact_name ?? null,
		data.contact_email ?? null,
		data.partner_type,
		data.description ?? null,
		now
	);

	return id;
}

export function updatePartner(partnerId: string, data: {
	name?: string;
	partner_type?: string;
	logo_url?: string;
	website_url?: string;
	contact_name?: string;
	contact_email?: string;
	description?: string;
}): boolean {
	const db = getDatabase();

	const fields: string[] = [];
	const values: any[] = [];

	if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
	if (data.partner_type !== undefined) { fields.push('partner_type = ?'); values.push(data.partner_type); }
	if (data.logo_url !== undefined) { fields.push('logo_url = ?'); values.push(data.logo_url || null); }
	if (data.website_url !== undefined) { fields.push('website_url = ?'); values.push(data.website_url || null); }
	if (data.contact_name !== undefined) { fields.push('contact_name = ?'); values.push(data.contact_name || null); }
	if (data.contact_email !== undefined) { fields.push('contact_email = ?'); values.push(data.contact_email || null); }
	if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description || null); }

	if (fields.length === 0) return false;

	values.push(partnerId);
	const result = db.prepare(`UPDATE partners SET ${fields.join(', ')} WHERE partner_id = ?`).run(...values);
	return result.changes > 0;
}

// ── Locations ────────────────────────────────────────────────────────

export function listLocations(): LocationRow[] {
	const db = getDatabase();
	return db.prepare(`
		SELECT
			l.*,
			(SELECT COUNT(*) FROM rooms r WHERE r.location_id = l.location_id) AS room_count
		FROM locations l
		ORDER BY l.city ASC, l.name ASC
	`).all() as LocationRow[];
}

export function getLocationById(locationId: string): LocationRow | null {
	const db = getDatabase();
	const row = db.prepare('SELECT * FROM locations WHERE location_id = ?').get(locationId);
	return (row as LocationRow) ?? null;
}

export function createLocation(data: {
	name: string;
	address: string;
	city: string;
}): string {
	const db = getDatabase();
	const id = generateId();
	const now = nowIso();

	db.prepare(`
		INSERT INTO locations (location_id, name, address, city, created_at)
		VALUES (?, ?, ?, ?, ?)
	`).run(id, data.name, data.address, data.city, now);

	return id;
}

export function updateLocation(locationId: string, data: {
	name?: string;
	address?: string;
	city?: string;
}): boolean {
	const db = getDatabase();

	const fields: string[] = [];
	const values: any[] = [];

	if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
	if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
	if (data.city !== undefined) { fields.push('city = ?'); values.push(data.city); }

	if (fields.length === 0) return false;

	values.push(locationId);
	const result = db.prepare(`UPDATE locations SET ${fields.join(', ')} WHERE location_id = ?`).run(...values);
	return result.changes > 0;
}

// ── Rooms ────────────────────────────────────────────────────────────

export function listRooms(): RoomRow[] {
	const db = getDatabase();
	return db.prepare(`
		SELECT
			r.*,
			l.name AS location_name
		FROM rooms r
		JOIN locations l ON l.location_id = r.location_id
		ORDER BY l.city ASC, l.name ASC, r.name ASC
	`).all() as RoomRow[];
}

export function getRoomsByLocation(locationId: string): RoomRow[] {
	const db = getDatabase();
	return db.prepare(`
		SELECT r.*, l.name AS location_name
		FROM rooms r
		JOIN locations l ON l.location_id = r.location_id
		WHERE r.location_id = ?
		ORDER BY r.name ASC
	`).all(locationId) as RoomRow[];
}

export function createRoom(data: {
	location_id: string;
	name: string;
	max_pax_tables: number;
	max_pax_no_tables: number;
}): string {
	const db = getDatabase();
	const id = generateId();
	const now = nowIso();

	db.prepare(`
		INSERT INTO rooms (room_id, location_id, name, max_pax_tables, max_pax_no_tables, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(id, data.location_id, data.name, data.max_pax_tables, data.max_pax_no_tables, now);

	return id;
}

export function updateRoom(roomId: string, data: {
	location_id?: string;
	name?: string;
	max_pax_tables?: number;
	max_pax_no_tables?: number;
}): boolean {
	const db = getDatabase();

	const fields: string[] = [];
	const values: any[] = [];

	if (data.location_id !== undefined) { fields.push('location_id = ?'); values.push(data.location_id); }
	if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
	if (data.max_pax_tables !== undefined) { fields.push('max_pax_tables = ?'); values.push(data.max_pax_tables); }
	if (data.max_pax_no_tables !== undefined) { fields.push('max_pax_no_tables = ?'); values.push(data.max_pax_no_tables); }

	if (fields.length === 0) return false;

	values.push(roomId);
	const result = db.prepare(`UPDATE rooms SET ${fields.join(', ')} WHERE room_id = ?`).run(...values);
	return result.changes > 0;
}
