// Premium LAN Chat JavaScript
var socket = io();
var clientName = "";
var isNameSet = false;

// DOM Elements
var introOverlay = document.getElementById('intro-overlay');
var nameModal = document.getElementById('name-modal');
var modalNameInput = document.getElementById('modal-name-input');
var modalSetNameButton = document.getElementById('modal-set-name');
var messageInput = document.getElementById('message-input');
var sendButton = document.getElementById('send-button');
var sendbox = document.getElementById('sendbox');
var messagesArea = document.getElementById('messages');
var systemLogs = document.getElementById('system-logs');
var memberListEl = document.getElementById('member-list');
var memberCountEl = document.getElementById('member-count');
var toggleLeftPanelBtn = document.getElementById('toggle-left-panel');
var toggleRightPanelBtn = document.getElementById('toggle-right-panel');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Show intro animation for 2.5 seconds, then show name modal
    setTimeout(() => {
        introOverlay.style.display = 'none';
        showNameModal();
    }, 2500);
    // Toggle side panels
    if (toggleLeftPanelBtn) {
        toggleLeftPanelBtn.addEventListener('click', function(){
            var container = document.querySelector('.chat-container');
            if (!container) return;
            container.classList.toggle('collapsed-left');
        });
    }
    
    if (toggleRightPanelBtn) {
        toggleRightPanelBtn.addEventListener('click', function(){
            var container = document.querySelector('.chat-container');
            if (!container) return;
            container.classList.toggle('collapsed-right');
        });
    }
});

// Show the Discord-like name setup modal
function showNameModal() {
    nameModal.style.display = 'flex';
    modalNameInput.focus();
    
    // Add enter key listener for modal
    modalNameInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            setName();
        }
    });
    
    // Add click listener for modal button
    modalSetNameButton.addEventListener('click', setName);
}

// Hide the name modal and start chat
function hideNameModal() {
    nameModal.style.display = 'none';
    sendbox.style.display = 'block';
    messageInput.focus();
}

// Set the user's name
function setName() {
    var name = modalNameInput.value.trim();
    if (name !== "" && name.length <= 32) {
        socket.emit('set_name', name);
        clientName = name;
        isNameSet = true;
        hideNameModal();
    } else if (name.length > 32) {
        // Show error for name too long
        modalNameInput.style.borderColor = '#ed4245';
        setTimeout(() => {
            modalNameInput.style.borderColor = 'rgba(79, 84, 92, 0.3)';
        }, 2000);
    }
}

// Send message function
function sendMessage() {
    if (!isNameSet) return;
    
    var message = messageInput.value.trim();
    if (message !== "") {
        socket.emit('message', message);
        messageInput.value = '';
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// User role management for colors
const userRoleMap = {};
const userRoleColors = [
    {color: '#5865f2', class: 'role-purple'},
    {color: '#ed4245', class: 'role-red'},
    {color: '#57f287', class: 'role-green'},
    {color: '#faa61a', class: 'role-yellow'},
    {color: '#eb459e', class: 'role-pink'},
    {color: '#00b0f4', class: 'role-cyan'}
];

function getUserRole(name, ip) {
    if (name === 'System') return {color: '', class: 'system'};
    const key = name + ip;
    if (!userRoleMap[key]) {
        const used = Object.values(userRoleMap).map(r => r.class);
        const available = userRoleColors.filter(r => !used.includes(r.class));
        userRoleMap[key] = available.length ? available[0] : userRoleColors[(Object.keys(userRoleMap).length) % userRoleColors.length];
    }
    return userRoleMap[key];
}

// Socket event handlers
socket.on('message', (data) => {
    // System messages should only go to System Logs
    const isSystem = (data.name === 'System');
    if (isSystem) {
        appendSystemLog(data.msg);
        return;
    }

    const newMessage = document.createElement('div');
    newMessage.classList.add('message');
    
    if (data.name.split(' ')[0] === clientName) {
        newMessage.classList.add('clientmsg');
    } else {
        newMessage.classList.add('user');
    }

    // Extract name and IP
    let namePart = data.name;
    let ipPart = '';
    const match = data.name.match(/^(.*?) \((.*?)\)$/);
    if (match) {
        namePart = match[1];
        ipPart = match[2];
    }
    
    const role = getUserRole(namePart, ipPart);
    
    // Render name and IP with color
    const nameHtml = `<span class="name-role ${role.class}">${namePart}</span>`;
    const ipHtml = ipPart ? `<span class="ip-role"> (${ipPart})</span>` : '';
    const metaHtml = `<span class="meta-block">${nameHtml}${ipHtml}:</span>`;
    newMessage.innerHTML = `${metaHtml} <span class="msg-text">${data.msg}</span>`;
    
    messagesArea.appendChild(newMessage);
    messagesArea.scrollTop = messagesArea.scrollHeight;
});

socket.on('connect', function() {
    console.log('Connected to LAN Chat server');
    updateConnectionStatus(true);
});

socket.on('disconnect', function() {
    console.log('Disconnected from server');
    updateConnectionStatus(false);
});

// Update connection status indicator
function updateConnectionStatus(connected) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.header-status span');
    
    if (connected) {
        statusIndicator.classList.remove('offline');
        statusIndicator.classList.add('online');
        statusText.textContent = 'Connected';
    } else {
        statusIndicator.classList.remove('online');
        statusIndicator.classList.add('offline');
        statusText.textContent = 'Disconnected';
    }
}

// Add some premium effects
document.addEventListener('DOMContentLoaded', function() {
    // Add typing indicator effect
    let typingTimeout;
    messageInput.addEventListener('input', function() {
        clearTimeout(typingTimeout);
        // Could add typing indicator here if needed
    });
    
    // Add smooth scroll to bottom when new messages arrive
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                setTimeout(() => {
                    messagesArea.scrollTop = messagesArea.scrollHeight;
                }, 100);
            }
        });
    });
    
    observer.observe(messagesArea, { childList: true });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + K to focus message input
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (isNameSet) {
            messageInput.focus();
        }
    }
    
    // Escape to close modal (if open)
    if (event.key === 'Escape' && nameModal.style.display === 'flex') {
        // Don't allow closing modal without setting name
        modalNameInput.focus();
    }
});

// Add loading states for buttons
function setButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
    } else {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

// Enhanced message sending with loading state
const originalSendMessage = sendMessage;
sendMessage = function() {
    if (!isNameSet) return;
    
    var message = messageInput.value.trim();
    if (message !== "") {
        setButtonLoading(sendButton, true);
        socket.emit('message', message);
        messageInput.value = '';
        
        // Reset button state after a short delay
        setTimeout(() => {
            setButtonLoading(sendButton, false);
        }, 500);
    }
};

// System logs helper
function appendSystemLog(text) {
    if (!systemLogs) return;
    var item = document.createElement('div');
    item.className = 'log-item';
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, '0');
    var mm = String(now.getMinutes()).padStart(2, '0');
    item.textContent = '[' + hh + ':' + mm + '] ' + text;
    systemLogs.appendChild(item);
    systemLogs.scrollTop = systemLogs.scrollHeight;
}

// Presence list handling
var members = []; // [{name, ip, sid}]

function renderMembers() {
    if (!memberListEl) return;
    memberListEl.innerHTML = '';
    members.forEach(function(u){
        var row = document.createElement('div');
        row.className = 'member-item';
        var dot = document.createElement('div');
        dot.className = 'member-avatar';
        var name = document.createElement('div');
        name.className = 'member-name';
        name.textContent = u.name;
        var ip = document.createElement('div');
        ip.className = 'member-ip';
        ip.textContent = ' (' + u.ip + ')';
        row.appendChild(dot);
        row.appendChild(name);
        row.appendChild(ip);
        memberListEl.appendChild(row);
    });
    if (memberCountEl) memberCountEl.textContent = String(members.length);
}

// Receive full presence snapshot
socket.on('presence_snapshot', function(payload){
    // payload: { users: [{sid,name,ip}], system: ["..."] }
    members = payload.users || [];
    renderMembers();
    // Optional: seed logs
    if (payload.system && systemLogs && !systemLogs.childElementCount) {
        payload.system.forEach(function(msg){ appendSystemLog(msg); });
    }
});

// Receive presence change events
socket.on('presence_join', function(user){
    // user: {sid,name,ip}
    var exists = members.find(function(u){ return u.sid === user.sid; });
    if (!exists) members.push(user);
    renderMembers();
    appendSystemLog(user.name + ' (' + user.ip + ') joined');
});

socket.on('presence_leave', function(user){
    // user: {sid,name,ip}
    members = members.filter(function(u){ return u.sid !== user.sid; });
    renderMembers();
    appendSystemLog((user.name || 'Unknown') + ' (' + (user.ip || '-') + ') left');
});