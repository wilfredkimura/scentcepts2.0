/**
 * API Service for communicating with the Spring Boot backend.
 * Provides functions for user authentication, catalog retrieval, and order checkout.
 */

const BASE_URL = 'http://localhost:8080/api';

/**
 * Helper function to retrieve headers, automatically adding the JWT token if present.
 * 
 * @returns {Headers} configured with content-type and optional Authorization token
 */
function getHeaders() {
    const headers = new Headers({
        'Content-Type': 'application/json'
    });
    
    // Check if window is defined (browser environment) and retrieve token
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            headers.append('Authorization', `Bearer ${token}`);
        }
    }
    return headers;
}

/**
 * Registers a new user.
 * 
 * @param {string} email user's email address
 * @param {string} password user's raw password
 * @returns {Promise<object>} response JSON containing message status
 */
export async function signup(email, password) {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Signup failed');
    }
    return response.json();
}

/**
 * Authenticates an existing user and returns a token.
 * 
 * @param {string} email user's email address
 * @param {string} password user's password
 * @returns {Promise<object>} contains JWT token, email, and role
 */
export async function signin(email, password) {
    const response = await fetch(`${BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid credentials');
    }
    return response.json();
}

/**
 * Fetches all perfumes in the catalog.
 * 
 * @returns {Promise<Array>} list of perfume items
 */
export async function getPerfumes() {
    const response = await fetch(`${BASE_URL}/perfumes`, {
        method: 'GET',
        headers: getHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch perfume catalog');
    }
    return response.json();
}

/**
 * Fetches details for a single perfume.
 * 
 * @param {number} id target perfume ID
 * @returns {Promise<object>} perfume details
 */
export async function getPerfumeById(id) {
    const response = await fetch(`${BASE_URL}/perfumes/${id}`, {
        method: 'GET',
        headers: getHeaders()
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch details for perfume ID: ${id}`);
    }
    return response.json();
}

/**
 * Submits an order checkout and triggers the Safaricom STK Push.
 * 
 * @param {string} phone customer phone number (e.g., 254712345678)
 * @param {number} amount transaction amount in KES
 * @param {number} perfumeId target perfume ID
 * @param {number} quantity count of items ordered
 * @returns {Promise<object>} response JSON containing orderId and STK status message
 */
export async function checkout(phone, amount, perfumeId, quantity) {
    const response = await fetch(`${BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ phone, amount, perfumeId, quantity })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout failed');
    }
    return response.json();
}

/**
 * Queries the current status of an order (e.g., PENDING, COMPLETED, FAILED).
 * 
 * @param {string} orderId UUID order tracking ID
 * @returns {Promise<object>} containing order details and current status
 */
export async function getOrderStatus(orderId) {
    const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
        method: 'GET',
        headers: getHeaders()
    });
    
    if (!response.ok) {
        throw new Error(`Failed to check status for Order ID: ${orderId}`);
    }
    return response.json();
}

/**
 * Fetches all registered users for the admin dashboard.
 * Restricted to accounts holding ROLE_ADMIN.
 * 
 * @returns {Promise<Array>} list of user mappings containing email, id, and role
 */
export async function getAdminUsers() {
    const response = await fetch(`${BASE_URL}/auth/admin/users`, {
        method: 'GET',
        headers: getHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Unauthorized or failed to load users. Admins only.');
    }
    return response.json();
}

/**
 * Fetches all placed order logs for the admin dashboard.
 * Restricted to accounts holding ROLE_ADMIN.
 * 
 * @returns {Promise<Array>} list of order items
 */
export async function getAdminOrders() {
    const response = await fetch(`${BASE_URL}/auth/admin/orders`, {
        method: 'GET',
        headers: getHeaders()
    });
    
    if (!response.ok) {
        throw new Error('Unauthorized or failed to load orders. Admins only.');
    }
    return response.json();
}
