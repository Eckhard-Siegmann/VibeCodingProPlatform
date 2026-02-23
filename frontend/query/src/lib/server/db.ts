import Database from 'better-sqlite3';
import path from 'path';

// Singleton database connection
let db: Database.Database | null = null;

/**
 * Get the database connection singleton.
 * Uses better-sqlite3 for synchronous, simple SQLite access.
 *
 * Database path: ../../database/event.db relative to project root
 */
export function getDatabase(): Database.Database {
	if (db) {
		return db;
	}

	// Resolve path relative to the frontend/query directory
	const dbPath = path.resolve(process.cwd(), '..', '..', 'database', 'event.db');

	try {
		db = new Database(dbPath, {
			// Enable foreign key constraints
			fileMustExist: true
		});

		// Enable foreign keys (critical for referential integrity)
		db.pragma('foreign_keys = ON');

		// WAL mode for better concurrent read performance
		db.pragma('journal_mode = WAL');

		return db;
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		throw new Error(`Failed to connect to database at ${dbPath}: ${message}`);
	}
}

/**
 * Close the database connection.
 * Call this during graceful shutdown.
 */
export function closeDatabase(): void {
	if (db) {
		db.close();
		db = null;
	}
}

/**
 * Generate a UUID v4 for new records.
 * Uses crypto.randomUUID() which is available in Node.js 19+
 */
export function generateId(): string {
	return crypto.randomUUID();
}

/**
 * Get current ISO timestamp for created_at/updated_at fields.
 */
export function nowIso(): string {
	return new Date().toISOString();
}
