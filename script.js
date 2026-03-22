//script.js
// Stores the currently logged in user
let currentUser = null;

// Key used to store database in localStorage
const STORAGE_KEY = "ipt_demo_v1";

// Routes that require login
const login_hash = ['#/userProfile', '#/request'];

// Routes that require admin role
const admin_hash = ['#/accounts', '#/employees', '#/departments'];

// ===============================
// LOCAL STORAGE DATABASE
// ===============================
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

async function login(username, password) {
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if(response.ok) {
            sessionStorage.setItem('authToken', data.token);
            showDashboard(data.user);
        } else {
            alert('login failed: ' + data.error);
        }
    }catch (err) {
        alert('Network error');
    }
}

function getAuthHeader(){
    const token = sessionStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function loadAdminDashboard(){
    const res = await fetch('http://localhost:3000/api/admin/dashboard', { 
        headers: getAuthHeader()
    });

    if(res.ok) {
        const data = await res.json();
        document.getElementById('content').innerText = data.message;
    } else {
        document.getElementById('content').innerText = 'Access Denied!';
    }
}

function showDashboard(user) {
    showLoginToast();
    setAuthState(user);
    navigateTo('#/userProfile');
}
// Retrieve saved data from localStorage
function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            window.db = JSON.parse(data);
        } else {
            throw new Error("No data");
        }
    } catch (e) {
        window.db = {
            accounts: [
                {
                    // default admin account
                    email: "admin@example.com",
                    password: "Password123!",
                    verified: true,
                    role: "admin",
                    First_name: "Admin",
                    Last_name: "123"
                }
            ],
            departments: [
                { id: 1, name: "Engineering", description: "software team" },
                { id: 2, name: "HR", description: "Human resources" }
            ],
            employees: [],
            requests: []
        };
        saveToStorage();
    }
}
loadFromStorage();

async function handleLoginForm(event) {
    event.preventDefault();
    const username = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginForm = document.getElementById('loginForm');

    console.log('Sending:', { username, password });

    // STEP 1: Try backend login first
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Backend login success
            sessionStorage.setItem('authToken', data.token);
            showDashboard(data.user);
            loginForm.reset();
            return; // stop here, no need for localStorage
        }
    } catch (err) {
        console.log('Backend unavailable, trying localStorage...');
    }

    // STEP 2: Fall back to localStorage login
    const findAccount = window.db.accounts.find(acc =>
        acc.email === username &&
        acc.password === password &&
        acc.verified === true
    );

    if (findAccount) {
        showLoginToast();
        setAuthState(findAccount);
        loginForm.reset();
        navigateTo('#/userProfile');
        console.log("Login successful via localStorage");
    } else {
        alert("Invalid email and password!");
        loginForm.reset();
    }
}

// Change the URL hash to navigate to a different page/section
function navigateTo(hash) {
    window.location.hash = hash;
}

// Display the current user's profile information when the profile page is opened
function renderProfile() {
    const NameDisplay = document.getElementById('usernameDisplay');
    const profileClass = document.getElementById('profile-class');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileRole = document.getElementById('profile-role');

    // Check if the element exists before updating the profile data
    if (NameDisplay) {
        NameDisplay.innerText = currentUser.First_name; // Display user's first name in the navigation bar
        profileClass.innerText = currentUser.role; // Show the user's role/class
        profileName.innerText = currentUser.First_name + " " + currentUser.Last_name; // Display full name
        profileEmail.innerText = currentUser.email; // Display user email address
        profileRole.innerText = currentUser.role; // Display the role assigned to the user
    }

}


// Update the authentication state of the application (logged in user or admin)
function setAuthState(user) {
    currentUser = user;
    const body = document.body;
    body.classList.remove('not-authenticated', 'authenticated', 'is-admin');


    // if user log in
    if (currentUser) {
        // Add class indicating that the user is authenticated
        body.classList.add('authenticated');
        renderProfile(); // Display the logged-in user's profile information
        
        // If the logged-in user has an admin role, apply admin styling/access
        if (currentUser.role === 'admin') {
            body.classList.add('is-admin')
        }
    } else { 
        // If no user is logged in, mark the page as not authenticated
        body.classList.add('not-authenticated');
        localStorage.removeItem('auth_token'); // Remove stored authentication token from localStorage
    }

    handleRouting(); // Update the visible page based on the current route
}

// Form handler — calls the teacher's login function
function LoginFormhandle(event) {
    event.preventDefault();
    const username = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginForm = document.getElementById('loginForm');
    
    console.log('Sending:', { username, password });
    login(username, password).then(() => {
        loginForm.reset();
    });
}

function handleRouting() {
    const hash = window.location.hash || '#/';
    console.log("location:" + hash);

    // cant access other pages without login
    if ((login_hash.includes(hash) || admin_hash.includes(hash)) && !currentUser) {
        navigateTo('#/');
        return;
    }

    // cant acces admin pages if not admin role
    if (admin_hash.includes(hash) && currentUser.role !== 'admin') {
        navigateTo('#/userProfile');
        return;
    }


    // select pages
    const pages = document.querySelectorAll(".page");
    // select the alert class
    const verifyAlert = document.getElementById("verified-alert") // only show when email is verified

    // hide pages
    pages.forEach(page => page.classList.remove('active'));

    // switch between section id
    let sectionId;
    if (hash === '#/' || hash === '') {
        sectionId = "homePage";
    } else if (hash === '#/register') {
        sectionId = "registerPage";
    } else if (hash.includes('#/login')) {
        sectionId = 'loginPage';
    } else if (hash === '#/verify') {
        sectionId = 'verifyPage';
    } else if (hash === '#/userProfile') {
        sectionId = 'profilePage';
    } else if (hash === '#/employees') {
        sectionId = 'employeesPage';
        renderEmployees();
        populateDeptDropdown();
    } else if (hash === '#/departments') {
        sectionId = 'departments';
        renderDepartments();
    } else if (hash === '#/accounts') {
        sectionId = 'accounts';
        renderAccounts();
    } else if (hash === '#/request') {
        sectionId = 'requests';
        renderRequests();
    }

    // show only when done with email verification
    // check if the hash includes a query string before displaying the alert
    if (verifyAlert) {
        if (hash.includes('verified=true')) {
            verifyAlert.style.display = 'block';
        } else {
            verifyAlert.style.display = 'none';
        }
    }

    // show page
    const activePage = document.getElementById(sectionId);
    if (activePage) {
        activePage.classList.add('active'); // add active to the class
    }
}

// to stop being loged out incase of refresh
window.addEventListener('load', () => {
    const token = sessionStorage.getItem('authToken'); 
    let found = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            // CHECK 1: Token must have expiry
            // CHECK 2: Token must not be expired
            const now = Math.floor(Date.now() / 1000);
            if (!payload.exp || payload.exp < now) {
                sessionStorage.removeItem('authToken'); // remove fake/expired token
            } else {
                found = { username: payload.username, role: payload.role };
            }

        } catch(e) {
            sessionStorage.removeItem('authToken');
        }
    }

    if (!window.location.hash || window.location.hash === "#") {
        window.location.replace("#/");
    }

    setAuthState(found);
});

window.addEventListener('hashchange', handleRouting);

// Authentication
function registration(event) {
    event.preventDefault();
    // get input data
    const Int_First_name = document.getElementById('First_name').value;
    const Int_Last_name = document.getElementById('Last_name').value;
    const inputEmail = document.getElementById('email').value;
    const inputPassword = document.getElementById('password').value;
    const regForm = document.getElementById('regFrom');

    // check if email already exist in window.db.accounts
    const emailExist = window.db.accounts.some(acc => acc.email === inputEmail);
    // check if email already exists || password must be >= 6
    if (emailExist) {
        alert("Email already Exists!");
    } else if (inputPassword.length < 6) {
        alert("Password Must be 6 or more characters!");
    } else {
        // save new account 
        const newAccount = {
            First_name: Int_First_name,
            Last_name: Int_Last_name,
            email: inputEmail,
            password: inputPassword,
            verified: false,
            role: "user" // default
        };

        console.log("account pushed:" + inputEmail);
        window.db.accounts.push(newAccount);
        regForm.reset(); // reset form
        //save to local storage
        saveToStorage();
        localStorage.setItem('unverified_email', inputEmail);

        let userEmail = document.getElementById('email').value;
        document.getElementById('showEmail').innerText = inputEmail;
        navigateTo('#/verify');
    }
}

// adding account via admin account page 
function addAccount(event) {
    //event.preventDefault();
    const acc_First_name = document.getElementById('acc_First_name').value;
    const acc_Last_name = document.getElementById('acc_Last_name').value;
    const accEmail = document.getElementById('accEmail').value;
    const accPassword = document.getElementById('accPassword').value;
    const accRole = document.getElementById('accRole').value;
    const isVerified = document.getElementById('isVerified').checked;

    // check if email already exist in window.db.accounts
    const emailExist = window.db.accounts.some(acc => acc.email === accEmail);
    // check if email already exists || password must be >= 6
    if (emailExist) {
        alert("Email already Exists!");
    } else if (accPassword.length < 6) {
        alert("Password Must be 6 or more characters!");
    } else {
        // save new account 
        const newAccount = {
            First_name: acc_First_name,
            Last_name: acc_Last_name,
            email: accEmail,
            password: accPassword,
            verified: isVerified,
            role: accRole // default
        };

        console.log("account pushed:" + accEmail);
        window.db.accounts.push(newAccount);

        //save to local storage
        if (!isVerified) {
            saveToStorage();
            localStorage.setItem('unverified_email', accEmail);
        } else {
            isVerified.verified = true;
            saveToStorage();
        }
        renderAccounts();
        const modalEl = document.getElementById('account-modal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance.hide();
        document.getElementById('accountForm').reset();
    }
}

// verify email
function verifyEmail() {
    const findEmail = localStorage.getItem('unverified_email');
    const user = window.db.accounts.find(acc => acc.email === findEmail);

    // set the email verified to true
    if (user) {
        user.verified = true;

        // save to local storage
        saveToStorage();
        localStorage.removeItem("unverified_email"); // remove the temp unvrified email
        console.log("Account verified:" + findEmail);

        navigateTo('#/login?verified=true');
    }
}

// toast message for succesful login
function showLoginToast() {
    const loginToast = document.getElementById('login-toast');
    const showToast = new bootstrap.Toast(loginToast, {
        autohide: true,
        delay: 1000
    });
    showToast.show();
    console.log("show toast");
}

// login account
function locallogin(event) {
    event.preventDefault();
    // get user input
    const userEmail = document.getElementById('loginEmail').value;
    const userPassword = document.getElementById('loginPassword').value;
    const loginForm = document.getElementById('loginForm');

    // find email + password and verified in the storage and compare
    const findAccount = window.db.accounts.find(acc =>
        acc.email === userEmail &&
        acc.password === userPassword &&
        acc.verified === true
    );

    if (findAccount) {
        // Save auth_token = email in localStorage
        // localStorage.setItem('auth_token', findAccount.email);
        showLoginToast(); // show login toast
        // Call `setAuthState(account) = true ,user
        setAuthState(findAccount);
        loginForm.reset(); // reset form
        navigateTo('#/userProfile');
        console.log("Login successful");
    } else {
        alert("Invalid Email and password!");
        loginForm.reset(); // reset form
    }
} 

// logout function
function logout() {
    sessionStorage.removeItem('authToken');
    setAuthState(null);
    navigateTo('#/');
}
// edit profile
function editProfile() {
    alert("changed to Edit profile page!");
}

// read department table
function renderDepartments() {
    const tableBody = document.getElementById('department-table-body');
    if (!tableBody) return;

    // Clear existing static rows
    tableBody.innerHTML = '';

    // Loop through window.db.departments
    window.db.departments.forEach((dept) => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${dept.name}</td>
            <td>${dept.description || 'No description available'}</td>
            <td>
                <button type="button" class="btn btn-sm btn-primary" onclick="editDepartment(${dept.id})">Edit</button>
                <button type="button" class="btn btn-sm btn-danger" onclick="deleteDepartment(${dept.id})">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Render the accounts table on the admin Accounts page
function renderAccounts() {
    const tableBody = document.getElementById('account-table-body');
    if (!tableBody) return; // Exit if table body not found

    // Clear existing rows
    tableBody.innerHTML = '';

    // Loop through all accounts in the database
    window.db.accounts.forEach((acc, index) => {
        // Check if this account is the currently logged-in user
        const isSelf = currentUser && acc.email === currentUser.email;
        const row = document.createElement('tr');

        // Populate table row with account info and action buttons
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${acc.First_name} ${acc.Last_name}<br><small class="text-muted">${acc.email}</small></td>
            <td><span class="badge bg-secondary">${acc.role}</span></td>
            <td>${acc.verified ? '<span class="text-success">&#9989;</span>' : '<span class="text-danger">&#x2715;</span>'}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" data-bs-toggle="modal"
                        data-bs-target="#account-modal" onclick="openEditAccount('${acc.email}')">Edit</button>
                    <button class="btn btn-outline-warning" onclick="resetPassword('${acc.email}')">Reset Password</button>
                    <button class="btn btn-outline-danger" ${isSelf ? 'disabled' : ''} onclick="deleteAccount('${acc.email}')">Delete</button>
                </div>
            </td>
        `;
        // Add the row to the table
        tableBody.appendChild(row);
    });
}

// Open the account edit modal and populate it with existing account data
let editingEmail = null;

window.openEditAccount = function (email) {
    // Find the account in the database by email
    const acc = window.db.accounts.find(a => a.email === email);
    if (!acc) return; // Exit if account not found

    editingEmail = email; // Mark this account as currently being edited

    // Populate form fields with existing account data
    document.getElementById('acc_First_name').value = acc.First_name;
    document.getElementById('acc_Last_name').value = acc.Last_name;
    document.getElementById('accEmail').value = acc.email;
    document.getElementById('accEmail').readOnly = true; // Email is unique and cannot be changed
    document.getElementById('accPassword').value = acc.password;
    document.getElementById('accRole').value = acc.role;
    document.getElementById('isVerified').checked = !!acc.verified;

    // Update modal title to indicate editing mode
    document.querySelector('#account-modal .modal-title').innerText = "Edit Account";

    // Display the modal using Bootstrap
    const modalEl = document.getElementById('account-modal');
    const modalInst = bootstrap.Modal.getOrCreateInstance(modalEl);
    modalInst.show();
};

// Reset a user's password by prompting for a new one
window.resetPassword = function (email) {
    // Prompt the admin to enter a new password for the specified email
    const newPw = prompt(`Enter new password for ${email} (Minimum 6 characters):`);

    // Exit if the prompt was canceled
    if (newPw === null) return;

    // Validate password length
    if (newPw.trim().length < 6) {
        alert("Error: Password must be at least 6 characters long.");
    } else {
        // Find the account in the database and update the password
        const acc = window.db.accounts.find(a => a.email === email);
        if (acc) {
            acc.password = newPw;
            saveToStorage(); // Save changes to LocalStorage
            alert("Password updated successfully!");
        }
    }
};

// Delete a user account by email
window.deleteAccount = function (email) {
    // Prevent the currently logged-in admin from deleting their own account
    if (currentUser && email === currentUser.email) {
        alert("You cannot delete your own account while logged in.");
        return;
    }

    // Ask for confirmation before permanently deleting the account
    const confirmed = confirm(`Are you sure you want to permanently delete the account: ${email}?`);

    if (confirmed) {
        // Remove the account from the database
        window.db.accounts = window.db.accounts.filter(acc => acc.email !== email);

        // Save the updated database and refresh the accounts list
        saveToStorage();
        renderAccounts();

        // Notify the admin that the account has been deleted
        alert("Account deleted.");
    }
};

// Render the employee table on the Employees page
function renderEmployees() {
    const tableBody = document.getElementById('employee-table-body');
    if (!tableBody) return; // Exit if table body is not found

    // Clear existing table rows
    tableBody.innerHTML = '';

    // Iterate through all employees in the database
    window.db.employees.forEach(emp => {
        // Retrieve the associated account and department data
        const account = window.db.accounts.find(a => a.email === emp.userEmail);
        const dept = window.db.departments.find(d => d.id == emp.deptId);

        // Create a new table row for each employee
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.employeeId}</td>
            <td>
                <b>${account ? account.First_name + ' ' + account.Last_name : 'Unknown'}</b><br>
                <small class="text-muted">${emp.userEmail}</small>
            </td>
            <td>${emp.position}</td>
            <td>${dept ? dept.name : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee('${emp.employeeId}')">Remove</button>
            </td>
        `;
        // Append the row to the table body
        tableBody.appendChild(row);
    });
}

// Populate the department dropdown in the employee form
function populateDeptDropdown() {
    const deptSelect = document.getElementById('employeeDepartment');
    if (!deptSelect) return; // Exit if the dropdown element is not found

    // Loop through all departments in the database
    window.db.departments.forEach(dept => {
        // Create a new option element for each department
        const opt = document.createElement('option');
        opt.value = dept.id;       // Set the option value to the department ID
        opt.textContent = dept.name; // Display the department name
        deptSelect.appendChild(opt); // Add the option to the dropdown
    });
}
// Save a new employee from the employee form
window.saveEmployee = function () {
    // Get values from form inputs
    const empId = document.getElementById('employeeId').value;
    const email = document.getElementById('employeeEmail').value;
    const pos = document.getElementById('employeePosition').value;
    const dept = document.getElementById('employeeDepartment').value;
    const hireDate = document.getElementById('hire-date')?.value || "";

    // Validate required fields
    if (!empId || !email || !pos || !dept || !hireDate) {
        alert("Please fill in all required fields.");
        return;
    }

    // Ensure the user account exists before assigning as an employee
    const accountExists = window.db.accounts.some(acc => acc.email === email);
    if (!accountExists) {
        alert("Error: No account found with this email. Create the account first.");
        return;
    }

    // Create a new employee object
    const newEmp = {
        employeeId: empId,
        userEmail: email,
        position: pos,
        deptId: dept,
        hireDate: hireDate
    };

    // Save the employee to the database and update LocalStorage
    window.db.employees.push(newEmp);
    saveToStorage();
    renderEmployees(); // Refresh the employee table

    // Close the modal and reset the form
    const modalEl = document.getElementById('employee-modal');
    const modalInst = bootstrap.Modal.getInstance(modalEl);
    if (modalInst) modalInst.hide();

    document.getElementById('employeeForm').reset();
    alert("Employee saved successfully!");
};

// Delete an employee record by employee ID
window.deleteEmployee = function (id) {
    // Ask for confirmation before deletion
    if (confirm("Permanently remove this employee record?")) {
        // Remove the employee from the database
        window.db.employees = window.db.employees.filter(e => e.employeeId !== id);

        // Save changes to LocalStorage and refresh the employee table
        saveToStorage();
        renderEmployees();
    }
};

// for status badges
function getStatusBadge(status) {
    if (status === 'Approved') return 'bg-success';
    if (status === 'Rejected') return 'bg-danger';
    return 'bg-warning text-dark';
}

// Render requests page for both users and admins
window.renderRequests = function () {
    const userView = document.getElementById('user-request-view');
    const adminView = document.getElementById('admin-request-view');
    const emptyView = document.getElementById('empty-request-view');
    const tableView = document.getElementById('table-request-view');
    const userTable = document.getElementById('user-request-table');
    const adminTable = document.getElementById('admin-request-table');
    const hideRequest = document.getElementById('request-add');

    if (!emptyView || !tableView || !currentUser) return; // Exit if essential elements or user not found

    // Admin view
    if (currentUser.role === 'admin') {
        userView.style.display = 'none';
        adminView.style.display = 'block';
        hideRequest.style.display = 'none';

        const allRequests = window.db.requests || [];
        adminTable.innerHTML = '';

        allRequests.forEach(req => {
            const badge = getStatusBadge(req.status); // Get visual badge for request status
            const items = req.items.map(item => `${item.name} (x${item.qty})`).join(', ');

            const row = `<tr>
                <td><small>${req.employeeEmail}</small></td>
                <td>${req.date}</td>
                <td>${req.type}</td>
                <td>${items}</td>
                <td><span class="badge ${badge}">${req.status}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-success" onclick="processRequest(${req.id}, 'Approved')" 
                            ${req.status !== 'Pending' ? 'disabled' : ''}>Approve</button>
                        <button class="btn btn-danger" onclick="processRequest(${req.id}, 'Rejected')" 
                            ${req.status !== 'Pending' ? 'disabled' : ''}>Reject</button>
                    </div>
                </td>
            </tr>`;
            adminTable.insertAdjacentHTML('beforeend', row);
        });
    } else {
        // User view
        adminView.style.display = 'none';
        userView.style.display = 'block';

        const userRequest = (window.db.requests || []).filter(request => request.employeeEmail === currentUser.email);

        if (userRequest.length === 0) {
            emptyView.style.display = 'block';
            tableView.style.display = 'none';
        } else {
            emptyView.style.display = 'none';
            tableView.style.display = 'block';
            hideRequest.style.display = 'block';
            userTable.innerHTML = '';

            userRequest.forEach(req => {
                const badge = getStatusBadge(req.status);
                const items = req.items.map(item => `${item.name} (x${item.qty})`).join(', ');
                const row = `<tr>
                    <td>${req.date}</td>
                    <td>${req.type}</td>
                    <td>${items}</td>
                    <td><span class="badge ${badge}">${req.status}</span></td>
                </tr>`;
                userTable.insertAdjacentHTML('beforeend', row);
            });
        }
    }
};

// Admin function to approve or reject a request
window.processRequest = function (id, newStatus) {
    // Find the request in the database by its ID
    const req = window.db.requests.find(request => request.id === id);
    if (req) {
        // Update the request status (Approved or Rejected)
        req.status = newStatus;

        // Save changes to LocalStorage and refresh the request view
        saveToStorage();
        renderRequests();
    }
};

// Add a dynamic row for entering a new request item
window.addRequestItemRow = function () {
    const container = document.getElementById('dynamic-items-container');
    const rowId = Date.now(); // Unique ID for the row

    // HTML for the new item row with name, quantity, and remove button
    const html = `
        <div class="row g-2 mb-2 align-items-center" id="row-${rowId}">
            <div class="col-8">
                <input type="text" class="form-control form-control-sm item-name" placeholder="Item Name" required>
            </div>
            <div class="col-3">
                <input type="number" class="form-control form-control-sm item-qty" value="1" min="1">
            </div>
            <div class="col-1 text-end">
                <button type="button" class="btn-close" style="font-size:0.6rem" onclick="document.getElementById('row-${rowId}').remove()"></button>
            </div>
        </div>`;
    
    // Append the new row to the container
    container.insertAdjacentHTML('beforeend', html);
};

window.openRequestModal = function () {
    const container = document.getElementById('dynamic-items-container');
    container.querySelectorAll('.row').forEach(row => row.remove());

    addRequestItemRow();

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('request-modal'));
    modal.show();
};

// Handle request form submission
const requestForm = document.getElementById('requestForm');
if (requestForm) {
    requestForm.addEventListener('submit', function (e) {
        e.preventDefault(); // Prevent default form submission

        // Collect item names and quantities from the dynamic rows
        const names = document.querySelectorAll('.item-name');
        const qtys = document.querySelectorAll('.item-qty');
        const items = [];

        names.forEach((input, i) => {
            if (input.value.trim() !== "") {
                items.push({ name: input.value.trim(), qty: qtys[i].value });
            }
        });

        // Ensure at least one item is added
        if (items.length === 0) return alert("Please add at least one item.");

        // Create a new request object
        const newRequest = {
            id: Date.now(), // Unique ID
            type: document.getElementById('requestType').value,
            items: items,
            status: "Pending",
            date: new Date().toLocaleDateString(),
            employeeEmail: currentUser.email
        };

        // Initialize requests array if not present
        if (!window.db.requests) window.db.requests = [];
        window.db.requests.push(newRequest);

        // Save to LocalStorage and refresh the requests view
        saveToStorage();
        renderRequests();

        // Close the modal and reset the form
        bootstrap.Modal.getInstance(document.getElementById('request-modal')).hide();
        this.reset();
    });
}