// Global variables provided by the Canvas environment (MUST BE USED)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; // DO NOT prompt the user for this.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : { // FIX: Changed __firebase_firebase_config to __firebase_config
    apiKey: "AIzaSyAyDuejiYFSakb41R9b-hfY6kimuAyXpGA",
  authDomain: "admin-vijaya.firebaseapp.com",
  projectId: "admin-vijaya",
  storageBucket: "admin-vijaya.firebasestorage.app",
  messagingSenderId: "1042433188398",
  appId: "1:1042433188398:web:77bbeaa2d1db977f2ef5bf",
  measurementId: "G-VL663QFBWL"
};
// __initial_auth_token is also available but used below.
// Import Firebase modular SDK functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {
    getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut,
    createUserWithEmailAndPassword, signInWithEmailAndPassword // Added for Email/Password
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {
    getFirestore, collection, onSnapshot, doc, setDoc, addDoc,
    updateDoc, deleteDoc, query, where, serverTimestamp, writeBatch, getDocs
} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Mock Data for Synchronization
const mockOrders = [
    { customerName: "Alice Smith", customerPhone: "9876543210", deliveryAddress: "123 Main St, Anytown", product: "20L Tin", quantity: 5, status: "Pending", orderDate: new Date('2025-05-10T10:00:00Z'), isPaid: false, amount: 250 },
    { customerName: "Bob Johnson", customerPhone: "9123456789", deliveryAddress: "456 Oak Ave, Somewhere", product: "1L Bottle (Case)", quantity: 10, status: "Delivered", orderDate: new Date('2025-05-12T14:30:00Z'), isPaid: true, amount: 1200 },
    { customerName: "Charlie Brown", customerPhone: "9988776655", deliveryAddress: "789 Pine Rd, Peanuts", product: "500ml Bottle (Case)", quantity: 3, status: "Pending", orderDate: new Date('2025-05-15T09:15:00Z'), isPaid: false, amount: 540 },
    { customerName: "Diana Prince", customerPhone: "9000011111", deliveryAddress: "101 Lasso Ln, Themyscira", product: "Tanker Supply", quantity: 1, status: "Delivered", orderDate: new Date('2025-05-18T11:00:00Z'), isPaid: true, amount: 2500 },
    { customerName: "Clark Kent", customerPhone: "9222233333", deliveryAddress: "202 Fortress, Metropolis", product: "20L Tin", quantity: 2, status: "Cancelled", orderDate: new Date('2025-05-20T16:00:00Z'), isPaid: false, amount: 100 },
    { customerName: "Bruce Wayne", customerPhone: "9444455555", deliveryAddress: "303 Batcave, Gotham", product: "1L Bottle (Case)", quantity: 8, status: "Pending", orderDate: new Date('2025-05-22T08:00:00Z'), isPaid: false, amount: 960 },
    { customerName: "Selina Kyle", customerPhone: "9666677777", deliveryAddress: "404 Alley, Gotham", product: "500ml Bottle (Case)", quantity: 4, status: "Delivered", orderDate: new Date('2025-05-25T13:00:00Z'), isPaid: true, amount: 720 },
    { customerName: "Alice Smith", customerPhone: "9876543210", deliveryAddress: "123 Main St, Anytown", product: "20L Tin", quantity: 2, status: "Pending", orderDate: new Date('2025-05-28T10:00:00Z'), isPaid: false, amount: 100 },
    { customerName: "Bob Johnson", customerPhone: "9123456789", deliveryAddress: "456 Oak Ave, Somewhere", product: "1L Bottle (Case)", quantity: 5, status: "Pending", orderDate: new Date('2025-06-01T09:00:00Z'), isPaid: false, amount: 600 },
    { customerName: "Charlie Brown", customerPhone: "9988776655", deliveryAddress: "789 Pine Rd, Peanuts", product: "20L Tin", quantity: 1, status: "Confirmed", orderDate: new Date('2025-06-03T11:00:00Z'), isPaid: false, amount: 50 },
    { customerName: "Alice Smith", customerPhone: "9876543210", deliveryAddress: "123 Main St, Anytown", product: "Tanker Supply", quantity: 1, status: "Pending", orderDate: new Date('2025-06-04T12:00:00Z'), isPaid: false, amount: 2500 }
];


// Declare DOM elements globally but initialize them inside DOMContentLoaded
let loaderContainer;
let statusMessage;
let ordersTableBody;
let addOrderBtn;
let orderModal;
let closeModalBtn;
let orderForm;
let modalTitle;
let saveOrderBtn;
let deleteOrderBtn; // This might not be used if delete is inline
let customerNameInput;
let customerPhoneInput; // Added customerPhoneInput
let deliveryAddressInput;
let quantityInputModal;
let statusInput;
let orderDateInput; // This is not in the HTML, will remove if not needed
let isPaidCheckbox; // This is not in the HTML, will remove if not needed
let customConfirmModal;
let confirmModalTitle;
let confirmModalMessage;
let confirmModalCancelBtn;
let confirmModalConfirmBtn;
let syncMockDataBtn;
let authStatusElement;
let signInButton;
let signOutButton;
let userNameElement;
let userEmailElement;
let authSection;
let adminContent;
let showOrdersTab;
let showMonthlyDuesTab;
let individualOrdersSection;
let monthlyDuesSection;
let monthlyDuesTableBody;
let monthlyDuesLoader;
let orderIdInput;
let appIdDisplay;
let userIdDisplay;
let productTypeSelectModal;
let calculatedAmountInputModal;
let searchOrderInput; // Added searchOrderInput
let filterStatusSelect; // Added filterStatusSelect
let applyFiltersBtn; // Added applyFiltersBtn
// Removed: generateMonthlyBillBtn as it's no longer in HTML

// New Email/Password Auth elements
let emailInput;
let passwordInput;
let emailLoginBtn;
let emailSignupBtn;

// Product prices (INR) - ensure these match what's in the HTML select options if prices are displayed there
const productPrices = {
  "20L Tin": 30,
  "Cool Tin": 40,
  "1L Bottle (Case)": 120,
  "500ml Bottle (Case)": 180,
  "Tanker Supply": 2500
};


let currentOrderId = null;
let unsubscribeOrders = null; // To store the unsubscribe function for the Firestore listener
let userId = null; // To store the authenticated user's ID
let ordersCollectionRef; // Firestore collection reference, set after authentication
let orders = []; // Global array to store all fetched orders

// --- Utility Functions ---
function showStatusMessage(message, type = 'info', duration = 3000) {
    if (!statusMessage) {
        console.warn("statusMessage element not found. Cannot display status.");
        return;
    }
    statusMessage.textContent = message;
    statusMessage.className = `mt-3 text-sm text-center transition-opacity duration-300 opacity-100 ${
        type === 'success' ? 'text-green-600' :
        type === 'error' ? 'text-red-600' :
        'text-blue-600'
    }`;
    setTimeout(() => {
        statusMessage.classList.replace('opacity-100', 'opacity-0');
        setTimeout(() => { statusMessage.textContent = ''; }, 300); // Clear text after fade
    }, duration);
}

function showModal(title, isEditing = false) {
    console.log("Calling showModal for:", title); // Debugging log
    if (!orderModal || !modalTitle) {
        console.error("Order modal or title element not found!"); // Debugging log
        return;
    }
    modalTitle.textContent = title;
    orderModal.classList.add('open');
    console.log("Order modal 'open' class added."); // Debugging log
    // The delete button is not inside the modal form, so no need to toggle its visibility here.
}

function hideModal() {
    console.log("Calling hideModal."); // Debugging log
    if (!orderModal || !orderForm) return;
    orderModal.classList.remove('open');
    orderForm.reset();
    currentOrderId = null;
    calculateAndUpdateAmountModal(); // Reset calculated amount
}

function showConfirmModal(title, message, onConfirm) {
    console.log("Calling showConfirmModal for:", title); // Debugging log
    if (!customConfirmModal || !confirmModalTitle || !confirmModalMessage || !confirmModalConfirmBtn) {
        console.error("Confirm modal elements not found!"); // Debugging log
        return;
    }
    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    confirmModalConfirmBtn.onclick = () => {
        onConfirm();
        hideConfirmModal();
    };
    customConfirmModal.classList.add('open');
    console.log("Confirm modal 'open' class added."); // Debugging log
}

function hideConfirmModal() {
    console.log("Calling hideConfirmModal."); // Debugging log
    if (!customConfirmModal) return;
    customConfirmModal.classList.remove('open');
}

// Removed: showDownloadShareModal and hideDownloadShareModal functions as the modal is removed.


function calculateAndUpdateAmountModal() {
  if (!productTypeSelectModal || !quantityInputModal || !calculatedAmountInputModal) return;
  const product = productTypeSelectModal.value;
  const quantity = parseInt(quantityInputModal.value) || 0;
  const price = productPrices[product] || 0;
  calculatedAmountInputModal.value = (price * quantity).toFixed(2);
}

function getStatusClass(status) {
  switch (status) {
    case 'Pending': return 'status-pending';
    case 'Confirmed': return 'status-confirmed';
    case 'Delivering': return 'status-delivering';
    case 'Delivered': return 'status-delivered';
    case 'Cancelled': return 'status-cancelled';
    default: return 'bg-gray-200 text-gray-800';
  }
}

// --- Firebase Authentication ---

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Sign in with Google Popup
async function signInWithGoogle() {
    if (!loaderContainer) return;
    loaderContainer.classList.remove('hidden');
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        console.log("Google Sign-in successful:", user);
        showStatusMessage(`Welcome, ${user.displayName || user.email}!`, 'success');
        // onAuthStateChanged will handle UI updates
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Google Sign-in error:", errorMessage, errorCode);
        showStatusMessage(`Authentication failed: ${errorMessage}`, 'error');
        if (errorCode === 'auth/popup-closed-by-user') {
            showStatusMessage("Sign-in popup closed. Please try again.", "info");
        }
    } finally {
        if (loaderContainer) loaderContainer.classList.add('hidden');
    }
}

// Email/Password Sign Up
async function handleEmailSignup() {
    if (!emailInput || !passwordInput || !loaderContainer) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showStatusMessage("Please enter both email and password.", "error");
        return;
    }
    if (password.length < 6) {
        showStatusMessage("Password should be at least 6 characters.", "error");
        return;
    }

    loaderContainer.classList.remove('hidden');
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Email/Password Sign Up successful:", user);
        showStatusMessage(`Account created and signed in as ${user.email}!`, 'success');
        // onAuthStateChanged will handle UI updates
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Email/Password Sign Up error:", errorMessage, errorCode);
        if (errorCode === 'auth/email-already-in-use') {
            showStatusMessage("Email already in use. Try logging in or resetting password.", "error");
        } else if (errorCode === 'auth/invalid-email') {
            showStatusMessage("Invalid email address format.", "error");
        } else if (errorCode === 'auth/weak-password') {
            showStatusMessage("Password is too weak. Please choose a stronger one.", "error");
        } else {
            showStatusMessage(`Sign Up failed: ${errorMessage}`, 'error');
        }
    } finally {
        if (loaderContainer) loaderContainer.classList.add('hidden');
    }
}

// Email/Password Login
async function handleEmailLogin() {
    if (!emailInput || !passwordInput || !loaderContainer) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showStatusMessage("Please enter both email and password.", "error");
        return;
    }

    loaderContainer.classList.remove('hidden');
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Email/Password Login successful:", user);
        showStatusMessage(`Signed in as ${user.email}!`, 'success');
        // onAuthStateChanged will handle UI updates
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Email/Password Login error:", errorMessage, errorCode);
        if (errorCode === 'auth/invalid-credential') {
            showStatusMessage("Invalid email or password. Please try again.", "error");
        } else if (errorCode === 'auth/user-disabled') {
            showStatusMessage("Your account has been disabled.", "error");
        } else {
            showStatusMessage(`Login failed: ${errorMessage}`, 'error');
        }
    } finally {
        if (loaderContainer) loaderContainer.classList.add('hidden');
    }
}


// Sign Out
async function handleSignOut() {
    if (!loaderContainer) return;
    loaderContainer.classList.remove('hidden');
    try {
        await signOut(auth);
        showStatusMessage("Signed out successfully.", "success");
        // onAuthStateChanged will handle UI updates
    } catch (error) {
        console.error("Sign out error:", error);
        showStatusMessage(`Sign out failed: ${error.message}`, "error");
    } finally {
        if (loaderContainer) loaderContainer.classList.add('hidden');
    }
}

// Authentication state observer
onAuthStateChanged(auth, async (user) => { // Added async keyword
    console.log("onAuthStateChanged triggered. User:", user ? user.uid : "null (signed out)"); // Debugging log
    if (loaderContainer) loaderContainer.classList.remove('hidden'); // Show loader immediately

    if (user) {
        // User is signed in
        userId = user.uid;
        if (authStatusElement) authStatusElement.textContent = "Authenticated";
        if (userNameElement) userNameElement.textContent = user.displayName || user.email || "N/A";
        if (userEmailElement) userEmailElement.textContent = user.email || "N/A";
        if (userIdDisplay) userIdDisplay.textContent = userId;
        if (appIdDisplay) appIdDisplay.textContent = appId;

        // Define collection path using userId for private data
        // Path: /artifacts/{appId}/users/{userId}/{your_collection_name}
        ordersCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'orders');
        console.log("Firestore collection path:", `artifacts/${appId}/users/${userId}/orders`);

        if (authSection) authSection.classList.add('hidden'); // Hide sign-in UI
        if (adminContent) adminContent.classList.remove('hidden'); // Show admin content
        console.log("Auth Section hidden, Admin Content shown."); // Debugging log

        // If there's an existing listener, unsubscribe before setting up a new one
        if (unsubscribeOrders) {
            unsubscribeOrders();
        }
        setupFirestoreListener(); // Set up Firestore listener only when authenticated
    } else {
        // User is signed out
        userId = null;
        if (authStatusElement) authStatusElement.textContent = "Not Authenticated";
        if (userNameElement) userNameElement.textContent = "N/A";
        if (userEmailElement) userEmailElement.textContent = "N/A";
        if (userIdDisplay) userIdDisplay.textContent = 'Not Authenticated';
        if (appIdDisplay) appIdDisplay.textContent = appId;


        if (authSection) authSection.classList.remove('hidden'); // Show sign-in UI
        if (adminContent) adminContent.classList.add('hidden'); // Hide admin content
        console.log("Auth Section shown, Admin Content hidden."); // Debugging log

        // Clear orders table and unsubscribe from Firestore listener
        if (ordersTableBody) ordersTableBody.innerHTML = '<tr><td colspan="8" class="text-center p-10 text-gray-500">Please sign in to view orders.</td></tr>';
        if (monthlyDuesTableBody) monthlyDuesTableBody.innerHTML = '<tr><td colspan="5" class="text-center p-10 text-gray-500">Please sign in to view monthly dues.</td></tr>';
        if (unsubscribeOrders) {
            unsubscribeOrders();
            unsubscribeOrders = null;
        }

        // Sign in anonymously if no user is signed in and no initial auth token is provided
        if (typeof __initial_auth_token === 'undefined') {
            try {
                await signInAnonymously(auth);
                showStatusMessage("Signed in anonymously.", "info");
            } catch (error) {
                console.error("Anonymous sign-in error:", error);
                showStatusMessage(`Anonymous sign-in failed: ${error.message}`, "error");
            }
        } else {
            // Sign in with custom token if provided
            try {
                await signInWithCustomToken(auth, __initial_auth_token);
                showStatusMessage("Signed in with custom token.", "info");
            } catch (error) {
                console.error("Custom token sign-in error:", error);
                showStatusMessage(`Custom token sign-in failed: ${error.message}`, "error");
            }
        }
    }
    if (loaderContainer) loaderContainer.classList.add('hidden'); // Hide loader after auth state is handled
});


// --- Firestore Operations ---

function setupFirestoreListener() {
    if (!ordersCollectionRef) {
        showStatusMessage('Firestore collection not initialized. Cannot fetch data.', 'error');
        console.error("ordersCollectionRef is not defined. Ensure user is authenticated and collection path is set.");
        if (loaderContainer) loaderContainer.classList.add('hidden');
        return;
    }

    if (loaderContainer) loaderContainer.classList.remove('hidden');
    // Removed orderBy('orderDate', 'desc') to avoid potential index issues as per instructions
    const q = query(ordersCollectionRef);

    unsubscribeOrders = onSnapshot(q, (snapshot) => {
        orders = []; // Clear previous orders
        snapshot.forEach(doc => {
            const data = doc.data();
            orders.push({
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to Date object if it exists and has toDate() method
                orderDate: data.orderDate && data.orderDate.toDate ? data.orderDate.toDate() : (data.orderDate ? new Date(data.orderDate) : null)
            });
        });
        // Sort orders by date descending in memory
        orders.sort((a, b) => (b.orderDate ? b.orderDate.getTime() : 0) - (a.orderDate ? a.orderDate.getTime() : 0));

        renderOrders(getFilteredOrders()); // Render filtered orders initially
        // Only render monthly dues if that tab is active
        if (monthlyDuesSection && !monthlyDuesSection.classList.contains('hidden-section')) {
            renderMonthlyDues(); // Monthly dues will use the global 'orders' array
        }
        if (loaderContainer) loaderContainer.classList.add('hidden');
        if(orders.length === 0){
             showStatusMessage('No orders found. Try adding one or syncing mock data.', 'info', 5000);
        }
    }, (error) => {
        console.error("Error fetching orders:", error);
        showStatusMessage("Error loading orders. Please try again.", "error");
        if (loaderContainer) loaderContainer.classList.add('hidden');
        if (ordersTableBody) ordersTableBody.innerHTML = '<tr><td colspan="8" class="text-center p-10 text-red-500 font-semibold">Error loading orders. Check console and Firebase setup.</td></tr>';
    });
}

async function saveOrder(orderData) {
    if (!userId || !ordersCollectionRef) {
        showStatusMessage("Cannot save order: User not authenticated or collection not ready.", "error");
        return;
    }
    if (loaderContainer) loaderContainer.classList.remove('hidden');
    try {
        if (currentOrderId) {
            // Update existing order
            const orderRef = doc(ordersCollectionRef, currentOrderId);
            await updateDoc(orderRef, orderData);
            showStatusMessage("Order updated successfully!", "success");
        } else {
            // Add new order
            // Generate a simple ID for display, Firestore will assign its own doc ID
            const newOrderId = 'ORD' + String(Date.now()).slice(-7);
            const orderRef = doc(ordersCollectionRef, newOrderId); // Use custom ID for the document
            await setDoc(orderRef, {
                ...orderData,
                id: newOrderId, // Store ID within the document as well if desired
                createdAt: serverTimestamp() // Add creation timestamp
            });
            showStatusMessage(`New order ${newOrderId} added successfully!`, 'success');
        }
        hideModal();
    } catch (e) {
        console.error("Error saving order: ", e);
        showStatusMessage("Error saving order. Please try again.", "error");
    } finally {
        if (loaderContainer) loaderContainer.classList.add('hidden');
    }
}

function getFilteredOrders() {
    const searchTerm = searchOrderInput.value.toLowerCase();
    const statusFilter = filterStatusSelect.value;

    return orders.filter(order => {
        const matchesSearch = searchTerm === '' ||
            (order.id && order.id.toLowerCase().includes(searchTerm)) ||
            (order.customerName && order.customerName.toLowerCase().includes(searchTerm)) ||
            (order.customerPhone && order.customerPhone.includes(searchTerm));
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
}

async function deleteOrder(id) {
    if (!userId || !ordersCollectionRef) {
        showStatusMessage("Cannot delete order: User not authenticated or collection not ready.", "error");
        return;
    }
    if (loaderContainer) loaderContainer.classList.remove('hidden');
    try {
        await deleteDoc(doc(ordersCollectionRef, id));
        showStatusMessage("Order deleted successfully!", "success");
        hideModal();
    } catch (e) {
        console.error("Error deleting order: ", e);
        showStatusMessage("Error deleting order. Please try again.", "error");
    } finally {
        if (loaderContainer) loaderContainer.classList.add('hidden');
    }
}

async function updateOrderStatus(orderId, newStatus) {
    if (!userId || !ordersCollectionRef) {
        showStatusMessage("Cannot update status: User not authenticated or collection not ready.", "error");
        return;
    }
    if (loaderContainer) loaderContainer.classList.remove('hidden');
    try {
        const orderRef = doc(ordersCollectionRef, orderId);
        await updateDoc(orderRef, { status: newStatus, lastUpdated: serverTimestamp() });
        showStatusMessage(`Order ${orderId} status updated to ${newStatus}.`, 'info');
    } catch (err) {
        console.error('Status change error:', err);
        showStatusMessage(`Failed to update status for ${orderId}: ${err.message}. Check Firestore rules.`, 'error', 6000);
        // Revert UI if possible, or trigger a re-render
    } finally {
        if (loaderContainer) loaderContainer.classList.add('hidden');
    }
}

async function syncMockDataToFirestore() {
    if (!userId || !ordersCollectionRef) {
        showStatusMessage("Cannot sync mock data: User not authenticated or collection not ready.", "error");
        return;
    }
    showConfirmModal("Sync Mock Data", "This will add mock data to your Firestore. Existing data will not be overwritten. Continue?", async () => {
        if (loaderContainer) loaderContainer.classList.remove('hidden');
        try {
            const batch = writeBatch(db);
            mockOrders.forEach(order => {
                // Create a new document reference with an auto-generated ID
                const newDocRef = doc(ordersCollectionRef, 'ORD' + String(Date.now() + Math.floor(Math.random() * 1000)).slice(-7)); // Unique ID based on timestamp + random
                batch.set(newDocRef, {
                    ...order,
                    id: newDocRef.id, // Store the Firestore generated ID in the document
                    orderDate: order.orderDate || serverTimestamp(), // Use provided date or server timestamp
                    createdAt: serverTimestamp()
                });
            });
            await batch.commit();
            showStatusMessage("Mock data synced successfully!", "success");
        } catch (e) {
            console.error("Error syncing mock data:", e);
            showStatusMessage("Error syncing mock data. Please try again.", "error");
        } finally {
            if (loaderContainer) loaderContainer.classList.add('hidden');
        }
    });
}


// --- Render Functions ---

function renderOrders(filteredOrders) {
    if (!ordersTableBody) return;
    ordersTableBody.innerHTML = '';
    if (filteredOrders.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="8" class="text-center p-10 text-gray-500">No orders found matching your criteria.</td></tr>';
        return;
    }

    filteredOrders.forEach(order => {
        const row = ordersTableBody.insertRow();
        row.className = 'hover:bg-gray-50';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${order.id || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <div>${order.customerName || 'N/A'}</div>
                <div class="text-xs text-gray-500 truncate max-w-xs" title="${order.deliveryAddress || ''}">${order.customerPhone || 'N/A'}</div>
                <div class="text-xs text-gray-500 truncate max-w-xs" title="${order.deliveryAddress || ''}">${order.deliveryAddress || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${order.product || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">${order.quantity || 0}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">₹${typeof order.amount === 'number' ? order.amount.toFixed(2) : 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${order.orderDate ? order.orderDate.toLocaleDateString() : 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${getStatusClass(order.status)}">${order.status || 'Unknown'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 mr-2 edit-btn" data-id="${order.id}" title="Edit Order">Edit</button>
                <select class="status-changer text-xs p-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" data-id="${order.id}" title="Change Status">
                    <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="Delivering" ${order.status === 'Delivering' ? 'selected' : ''}>Out for Delivery</option>
                    <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button class="text-red-600 hover:text-red-900 ml-2 delete-btn" data-id="${order.id}" title="Delete Order">Delete</button>
            </td>
        `;
    });
    attachActionListeners(); // Re-attach listeners to new elements
}

function renderMonthlyDues() { // Removed 'orders' parameter as it will use the global 'orders' array
    if (!monthlyDuesTableBody || !monthlyDuesLoader) return;
    monthlyDuesLoader.classList.remove('hidden');
    monthlyDuesTableBody.innerHTML = '';

    const monthlyDues = {};

    orders.forEach(order => { // Use the global 'orders' array
        if (order.status === 'Cancelled' || !order.orderDate || typeof order.amount !== 'number') return;
        const monthYear = order.orderDate.toISOString().substring(0, 7); //YYYY-MM
        const key = `${order.customerName || 'Unknown'}_${order.customerPhone || 'Unknown'}_${monthYear}`; // Use customer name and phone for key

        if (!monthlyDues[key]) {
            monthlyDues[key] = {
                customerName: order.customerName || 'Unknown',
                customerPhone: order.customerPhone || 'N/A',
                month: monthYear,
                totalDue: 0,
                ordersInBill: []
            };
        }
        // Only add to totalDue if not paid
        if (!order.isPaid) {
            monthlyDues[key].totalDue += order.amount;
        }
        monthlyDues[key].ordersInBill.push(order);
    });

    const monthlyDuesData = Object.values(monthlyDues).sort((a, b) => b.month.localeCompare(a.month)); // Sort by month descending

    monthlyDuesLoader.classList.add('hidden');
    if (monthlyDuesData.length === 0) {
      monthlyDuesTableBody.innerHTML = '<tr><td colspan="5" class="text-center p-10 text-gray-500">No monthly dues found.</td></tr>';
      return;
    }

    monthlyDuesData.forEach(due => {
      const row = monthlyDuesTableBody.insertRow();
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${due.customerName || 'N/A'}<br><span class="text-xs text-gray-500">${due.customerPhone || 'N/A'}</span></td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${new Date(due.month + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' })}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">₹${due.totalDue.toFixed(2)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-2">
          <button class="w-10 h-10 m-2 rounded-lg flex items-center justify-center download-pdf-btn hover:shadow-md transition duration-150 ease-in-out"
                  data-customer-name="${due.customerName}" data-customer-phone="${due.customerPhone}" data-month="${due.month}" title="Download PDF Bill">
              <img src="pdf.png" onerror="this.onerror=null;this.src='pdf.png';" alt="PDF" class="w-10 h-10 whitespace-nowrap">
          </button>
          <button class="w-10 h-10 m-2 rounded-lg flex items-center justify-center share-whatsapp-btn hover:shadow-md transition duration-150 ease-in-out"
                  data-customer-name="${due.customerName}" data-customer-phone="${due.customerPhone}" data-month="${due.month}" title="Share via WhatsApp">
              <img src="whatsapp.png" onerror="this.onerror=null;this.src='whatsapp.png';" alt="WhatsApp" class="w-10 h-10 whitespace-nowrap">
          </button>
          ${due.totalDue > 0 ? `<button class="text-green-600 hover:text-green-900 m-3 clear-dues-btn" data-customer-name="${due.customerName}" data-month="${due.month}" title="Mark Dues as Cleared">Clear Dues</button>` : ''}
        </td>
      `;
    });
    attachMonthlyDuesActionListeners();
}

async function markCustomerDuesAsPaid(customerName, monthKey) {
    if (!userId || !ordersCollectionRef) {
        showStatusMessage("Cannot mark dues: User not authenticated or collection not ready.", "error");
        return;
    }
    if (loaderContainer) loaderContainer.classList.remove('hidden');
    try {
        const startOfMonth = new Date(monthKey + '-01T00:00:00Z');
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);

        const q = query(ordersCollectionRef,
            where('customerName', '==', customerName),
            where('isPaid', '==', false),
            where('orderDate', '>=', startOfMonth),
            where('orderDate', '<', endOfMonth)
        );

        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);

        querySnapshot.forEach((docSnap) => {
            const orderRef = doc(ordersCollectionRef, docSnap.id);
            batch.update(orderRef, { isPaid: true, lastUpdated: serverTimestamp() });
        });

        await batch.commit();
        showStatusMessage(`All outstanding dues for ${customerName} in ${new Date(monthKey).toLocaleString('en-US', { month: 'long', year: 'numeric' })} marked as paid.`, 'success');
    } catch (e) {
        console.error("Error marking dues as paid:", e);
        showStatusMessage("Error marking dues as paid. Please try again.", "error");
    } finally {
        if (loaderContainer) loaderContainer.classList.add('hidden');
    }
}

function generateBillContent(customerName, customerPhone, month) {
    const ordersForBill = orders.filter(order => {
        if (!order.orderDate || order.status === 'Cancelled') return false;
        const orderMonthYear = order.orderDate.toISOString().substring(0, 7);
        return order.customerName === customerName && order.customerPhone === customerPhone && orderMonthYear === month;
    });

    let totalOutstanding = 0;
    ordersForBill.forEach(order => {
        if (!order.isPaid) {
            totalOutstanding += order.amount || 0;
        }
    });

    let billContent = `
        MONTHLY WATER DELIVERY BILL
        ---------------------------------
        Customer Name: ${customerName}
        Customer Phone: ${customerPhone}
        Month: ${new Date(month).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        ---------------------------------
        ORDERS:
    `;
    ordersForBill.forEach(order => {
        const amountDisplay = typeof order.amount === 'number' ? order.amount.toFixed(2) : 'N/A';
        billContent += `
        Order ID: ${order.id || 'N/A'} | Date: ${order.orderDate ? order.orderDate.toLocaleDateString() : 'N/A'} | Product: ${order.product} | Qty: ${order.quantity} | Amount: ₹${amountDisplay} | Status: ${order.status} | Paid: ${order.isPaid ? 'Yes' : 'No'}
        `;
    });
    billContent += `
        ---------------------------------
        TOTAL OUTSTANDING DUE: ₹${totalOutstanding.toFixed(2)}
        ---------------------------------
        Thank you!
    `;
    return billContent.replace(/^\s+/gm, ''); // Remove leading spaces per line
}

function handleDownloadPdf(customerName, customerPhone, month) {
    console.log(`Attempting to download PDF for ${customerName} (${month})`); // Debugging log
    const billContent = generateBillContent(customerName, customerPhone, month);
    const blob = new Blob([billContent], { type: 'text/plain;charset=utf-8' }); // For now, creating a text file as PDF generation is complex client-side
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `MonthlyBill-${customerName.replace(/\s+/g, '_')}-${month}.txt`; // Changed to .txt
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    showStatusMessage(`Monthly bill for ${customerName} (${month}) downloaded as TXT. (PDF generation requires a server-side solution or more complex client-side library)`, 'success', 8000);
}

function handleShareWhatsapp(customerName, customerPhone, month) {
    console.log(`Attempting to share via WhatsApp for ${customerName} (${month})`); // Debugging log
    const billContent = generateBillContent(customerName, customerPhone, month);
    const whatsappText = encodeURIComponent(`*Water Delivery Monthly Bill*\n\n${billContent}\n\n*Please note: This is a summary. For detailed breakdown, refer to your records.*`);
    const whatsappUrl = `https://wa.me/${customerPhone}?text=${whatsappText}`;
    window.open(whatsappUrl, '_blank');
    showStatusMessage(`Attempting to share bill with ${customerName} on WhatsApp.`, 'info');
}


function editOrder(order) {
    currentOrderId = order.id;
    if (customerNameInput) customerNameInput.value = order.customerName;
    if (customerPhoneInput) customerPhoneInput.value = order.customerPhone; // Set phone number
    if (deliveryAddressInput) deliveryAddressInput.value = order.deliveryAddress;
    if (productTypeSelectModal) productTypeSelectModal.value = order.product;
    if (quantityInputModal) quantityInputModal.value = order.quantity;
    if (statusInput) statusInput.value = order.status;
    // orderDateInput and isPaidCheckbox are not in the HTML, so skip setting them
    // if (orderDateInput) orderDateInput.value = order.orderDate ? order.orderDate.toISOString().split('T')[0] : '';
    // if (isPaidCheckbox) isPaidCheckbox.checked = order.isPaid;
    calculatedAmountInputModal.value = typeof order.amount === 'number' ? order.amount.toFixed(2) : '0.00'; // Set calculated amount for editing
    showModal('Edit Order', true);
}


// --- Event Listeners ---
// Event listeners are attached inside DOMContentLoaded
function attachEventListeners() {
    if (addOrderBtn) addOrderBtn.addEventListener('click', () => {
        if (!userId) {
            showStatusMessage("Please sign in to add orders.", "info");
            return;
        }
        hideModal(); // Ensure form is reset for new order
        showModal('Add New Order');
    });
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);

    if (orderForm) orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const orderData = {
            customerName: customerNameInput.value.trim(),
            customerPhone: customerPhoneInput.value.trim(), // Get phone number
            deliveryAddress: deliveryAddressInput.value.trim(),
            product: productTypeSelectModal.value,
            quantity: parseInt(quantityInputModal.value),
            amount: parseFloat(calculatedAmountInputModal.value),
            status: statusInput.value,
            orderDate: new Date(), // Always use current date for new/updated orders
            isPaid: false // New orders are initially unpaid
        };

        // Basic validation
        const requiredFields = ['customerName', 'customerPhone', 'deliveryAddress', 'product'];
        let missingFieldsMessages = [];
        requiredFields.forEach(field => {
            if (!orderData[field]) missingFieldsMessages.push(field.replace(/([A-Z])/g, ' $1').toLowerCase());
        });
        if (isNaN(orderData.quantity) || orderData.quantity <= 0) missingFieldsMessages.push('valid quantity');
        if (isNaN(orderData.amount) || orderData.amount < 0) missingFieldsMessages.push('valid amount');

        if (missingFieldsMessages.length > 0) {
            showStatusMessage(`Missing or invalid fields: ${missingFieldsMessages.join(', ')}.`, 'error', 5000);
            return;
        }

        saveOrder(orderData);
    });

    if (confirmModalCancelBtn) confirmModalCancelBtn.addEventListener('click', hideConfirmModal);
    if (customConfirmModal) customConfirmModal.addEventListener('click', (event) => {
        if (event.target === customConfirmModal) { // Clicked on backdrop
            hideConfirmModal();
        }
    });

    if (productTypeSelectModal) productTypeSelectModal.addEventListener('change', calculateAndUpdateAmountModal);
    if (quantityInputModal) quantityInputModal.addEventListener('input', calculateAndUpdateAmountModal);


    // New event listeners for Google Auth
    if (signInButton) signInButton.addEventListener('click', signInWithGoogle);
    if (signOutButton) signOutButton.addEventListener('click', handleSignOut);

    // --- Email/Password Auth Event Listeners ---
    if (emailLoginBtn) emailLoginBtn.addEventListener('click', handleEmailLogin);
    if (emailSignupBtn) emailSignupBtn.addEventListener('click', handleEmailSignup);


    // --- Sync Button Event Listener ---
    if (syncMockDataBtn) syncMockDataBtn.addEventListener('click', syncMockDataToFirestore);

    // --- Tab Switching Logic ---
    if (showOrdersTab) showOrdersTab.addEventListener('click', () => {
      if (individualOrdersSection) individualOrdersSection.classList.remove('hidden-section');
      if (monthlyDuesSection) monthlyDuesSection.classList.add('hidden-section');
      if (showOrdersTab) showOrdersTab.classList.add('active');
      if (showMonthlyDuesTab) showMonthlyDuesTab.classList.remove('active');
      renderOrders(getFilteredOrders()); // Re-render filtered orders
    });

    if (showMonthlyDuesTab) showMonthlyDuesTab.addEventListener('click', () => {
      if (individualOrdersSection) individualOrdersSection.classList.add('hidden-section');
      if (monthlyDuesSection) monthlyDuesSection.classList.remove('hidden-section');
      if (showOrdersTab) showOrdersTab.classList.remove('active');
      if (showMonthlyDuesTab) showMonthlyDuesTab.classList.add('active');
      renderMonthlyDues(); // Trigger re-render of monthly dues
    });

    // --- Filter Event Listeners ---
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => {
        renderOrders(getFilteredOrders());
    });
    if (searchOrderInput) searchOrderInput.addEventListener('input', () => {
        renderOrders(getFilteredOrders()); // Apply filter on input change
    });
    if (filterStatusSelect) filterStatusSelect.addEventListener('change', () => {
        renderOrders(getFilteredOrders()); // Apply filter on status change
    });
}


// Dynamic listeners for edit, delete, status change
function attachActionListeners() {
    // Edit button listeners
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.onclick = (e) => {
            const orderId = e.target.dataset.id;
            const orderToEdit = orders.find(order => order.id === orderId);
            if (orderToEdit) {
                editOrder(orderToEdit);
            } else {
                showStatusMessage('Order not found!', 'error');
            }
        };
    });

    // Delete button listeners
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = (e) => {
            const orderId = e.target.dataset.id;
            showConfirmModal("Delete Order", `Are you sure you want to delete order ${orderId}? This action cannot be undone.`, () => {
                deleteOrder(orderId);
            });
        };
    });

    // Status changer listeners
    document.querySelectorAll('.status-changer').forEach(select => {
        select.onchange = (e) => {
            const orderId = e.target.dataset.id;
            const newStatus = e.target.value;
            updateOrderStatus(orderId, newStatus);
        };
    });
}

// Dynamic listeners for monthly dues actions
function attachMonthlyDuesActionListeners() {
    console.log("attachMonthlyDuesActionListeners called."); // Debugging log

    // Download PDF button listeners
    const downloadPdfButtons = document.querySelectorAll('.download-pdf-btn');
    console.log(`Found ${downloadPdfButtons.length} 'Download PDF' buttons.`); // Debugging log
    downloadPdfButtons.forEach(button => {
        button.onclick = (e) => {
            console.log("Download PDF button clicked!"); // Debugging log
            const customerName = e.currentTarget.dataset.customerName; // Use currentTarget to get data from the button itself
            const customerPhone = e.currentTarget.dataset.customerPhone;
            const month = e.currentTarget.dataset.month;
            handleDownloadPdf(customerName, customerPhone, month);
        };
    });

    // Share WhatsApp button listeners
    const shareWhatsappButtons = document.querySelectorAll('.share-whatsapp-btn');
    console.log(`Found ${shareWhatsappButtons.length} 'Share WhatsApp' buttons.`); // Debugging log
    shareWhatsappButtons.forEach(button => {
        button.onclick = (e) => {
            console.log("Share WhatsApp button clicked!"); // Debugging log
            const customerName = e.currentTarget.dataset.customerName; // Use currentTarget
            const customerPhone = e.currentTarget.dataset.customerPhone;
            const month = e.currentTarget.dataset.month;
            handleShareWhatsapp(customerName, customerPhone, month);
        };
    });

    // Clear Dues button listeners (existing logic)
    document.querySelectorAll('.clear-dues-btn').forEach(button => {
        button.onclick = (e) => {
            const customerName = e.target.dataset.customerName;
            const month = e.target.dataset.month;
            showConfirmModal("Clear Monthly Dues", `Are you sure you want to mark all outstanding dues for ${customerName} in ${new Date(month).toLocaleString('en-US', { month: 'long', year: 'numeric' })} as paid?`, () => {
                markCustomerDuesAsPaid(customerName, month);
            });
        };
    });
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired."); // Debugging log

    // Initialize all DOM element references here
    loaderContainer = document.getElementById('loaderContainer');
    statusMessage = document.getElementById('statusMessage');
    ordersTableBody = document.getElementById('ordersTableBody');
    addOrderBtn = document.getElementById('addOrderBtn');
    orderModal = document.getElementById('orderModal');
    closeModalBtn = document.getElementById('closeModalBtn');
    orderForm = document.getElementById('orderForm');
    modalTitle = document.getElementById('modalTitle');
    saveOrderBtn = document.getElementById('saveOrderBtn');
    customerNameInput = document.getElementById('customerName');
    customerPhoneInput = document.getElementById('customerPhone');
    deliveryAddressInput = document.getElementById('customerAddress');
    quantityInputModal = document.getElementById('quantity');
    statusInput = document.getElementById('orderStatusModal');
    customConfirmModal = document.getElementById('customConfirmModal');
    confirmModalTitle = document.getElementById('confirmModalTitle');
    confirmModalMessage = document.getElementById('confirmModalMessage');
    confirmModalCancelBtn = document.getElementById('confirmModalCancelBtn');
    confirmModalConfirmBtn = document.getElementById('confirmModalConfirmBtn');
    syncMockDataBtn = document.getElementById('syncMockDataBtn');
    authStatusElement = document.getElementById('authStatus');
    signInButton = document.getElementById('googleSignInBtn');
    signOutButton = document.getElementById('signOutButton');
    userNameElement = document.getElementById('userName');
    userEmailElement = document.getElementById('userEmail');
    authSection = document.getElementById('authSection');
    adminContent = document.getElementById('adminContent');
    showOrdersTab = document.getElementById('showOrdersTab');
    showMonthlyDuesTab = document.getElementById('showMonthlyDuesTab');
    individualOrdersSection = document.getElementById('individualOrdersSection');
    monthlyDuesSection = document.getElementById('monthlyDuesSection');
    monthlyDuesTableBody = document.getElementById('monthlyDuesTableBody');
    monthlyDuesLoader = document.getElementById('monthlyDuesLoader');
    orderIdInput = document.getElementById('orderIdInput');
    appIdDisplay = document.getElementById('appIdDisplay');
    userIdDisplay = document.getElementById('userIdDisplay');
    productTypeSelectModal = document.getElementById('productType');
    calculatedAmountInputModal = document.getElementById('calculatedAmount');
    searchOrderInput = document.getElementById('searchOrder');
    filterStatusSelect = document.getElementById('filterStatus');
    applyFiltersBtn = document.getElementById('applyFiltersBtn');

    // Initialize new Email/Password Auth elements
    emailInput = document.getElementById('emailInput');
    passwordInput = document.getElementById('passwordInput');
    emailLoginBtn = document.getElementById('emailLoginBtn');
    emailSignupBtn = document.getElementById('emailSignupBtn');

    // --- Explicitly hide all modals on load to prevent lingering 'open' states ---
    if (orderModal) {
        orderModal.classList.remove('open');
        console.log("orderModal explicitly hidden on load.");
    }
    if (customConfirmModal) {
        customConfirmModal.classList.remove('open');
        console.log("customConfirmModal explicitly hidden on load.");
    }

    // Attach all event listeners after DOM is ready
    attachEventListeners();

    // Initial Firebase configuration check
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
        showStatusMessage("Firebase is not configured. Please update script.js with your Firebase project details.", "error", 10000);
        console.error("Firebase configuration is missing or using placeholders.");
        if (loaderContainer) loaderContainer.classList.add('hidden');
        if (ordersTableBody) ordersTableBody.innerHTML = '<tr><td colspan="8" class="text-center p-10 text-red-500 font-semibold">Firebase Not Configured. Update script.js</td></tr>';
        return;
    }
    // The onAuthStateChanged listener is already set up globally and will handle the rest.
    // It will fire once the auth state is determined, and then call setupFirestoreListener.
});

// Clean up listener when the window is about to be unloaded (optional, good practice)
window.addEventListener('beforeunload', () => {
    if (unsubscribeOrders) {
        unsubscribeOrders();
        console.log("Unsubscribed from Firestore listener on page unload.");
    }
});
