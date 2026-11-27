// Runs before every test file: gives the tests an in-memory IndexedDB,
// because the test environment (jsdom) has none.
import 'fake-indexeddb/auto';
