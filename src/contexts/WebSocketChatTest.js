const BASE_URL = 'http://localhost:8000';
const GET_ME = BASE_URL + '/api/v1/me/';
const GET_CONVERSATION_ID_FROM_USER_ID = (userId) => BASE_URL + `/api/v1/conversations/user/?to_user_id=${userId}`;
const GET_FRIENDS_URL = BASE_URL + '/api/v1/users/friends/';
const GET_CONVERSATIONS_URL = BASE_URL + '/api/v1/conversations/';
const WS_BASE_URL = 'ws://localhost:8000';
const WS_URL = WS_BASE_URL + '/ws/chat/';
const CONVERSATION_MESSAGE_URL = (conversationId) => BASE_URL + `/api/v1/conversations/${conversationId}/messages/`;

// Waiting for DOM to load
document.addEventListener('DOMContentLoaded', async () => {


    const chatApp = document.getElementById('chat-app');
    
    const friendsBtn = document.getElementById('friends-btn');
    const convosBtn = document.getElementById('convos-btn');
    const listContainer = document.getElementById('list-container');
    
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const messageList = document.getElementById('message-list');
    
    // Get new elements
    const logoutButton = document.getElementById('logout-button');
    const userDisplay = document.getElementById('user-display');
    const currentChatTopic = document.getElementById('current-chat-topic');
    
    // Save current conversation
    let currentConversationId = null;
    let currentUserId = null;
    let currentReply = null;
    let currentLastMessageId = null;
    let isLoadingMoreMessages = false;
    let mapConversationIdToConversation = new Map();

    let sendMessageMethod = 'send_message';

    // Handle Socket
    let chatSocket = null;

   

    class ChatSocket {
        constructor(url) {
            this.url = url;
            this.socket = null;
            this.user_id = localStorage.getItem('user_id');
            this.username = localStorage.getItem('username');
            this.access = localStorage.getItem('access');
            if (this.access) {
                this.url += '?token=' + this.access;
            }
        }
        connect(){
            this.socket = new WebSocket(this.url);
            this.socket.onopen = () => {
                console.log('Connected to socket');
            }

            this.socket.onmessage = (event) =>{
                try{
                    const data = JSON.parse(event.data);
                    console.log('Received message:', data);
                    if (data.type === 'message') {
                        const data_detail = data.data;
                        if (data_detail.conversation) {
                            const conversationId = data_detail.conversation;
                            const isNewConversation = !mapConversationIdToConversation.has(conversationId);
                            
                            if (isNewConversation) {
                                // New conversation (from DM), need to reload conversations list
                                showConversationsList().then(() => {
                                    // Automatically navigate to conversation tab if in DM mode
                                    if (sendMessageMethod === 'dm' && currentUserId) {
                                        sendMessageMethod = 'send_message';
                                        convosBtn.classList.add('active');
                                        friendsBtn.classList.remove('active');
                                        
                                        // Load new conversation
                                        currentConversationId = conversationId;
                                        const senderName = data_detail.sender_username || currentChatTopic.textContent;
                                        currentChatTopic.textContent = senderName;
                                        showConversationMessages(conversationId);
                                    }
                                });
                            } else {
                                // Update conversations list
                                showConversationsList();
                            }
                        }
                        addMessageToUI(data_detail.sender_username, data_detail.content, parseInt(data_detail.sender) === parseInt(this.user_id));    
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            }
            this.socket.onclose = () => {
                console.log('Disconnected from socket');
            };
          
            this.socket.onerror = (e) => {
                console.error('WebSocket error:', e);
            };
   
        }

        disconnect(){
            if (this.socket) {
                this.socket.close();
                this.socket = null;
                console.log('Disconnected from socket');
            }
        }

        sendMessage(message){
            if (this.socket && this.socket.readyState === WebSocket.OPEN){
                this.socket.send(JSON.stringify(message));
            }
            else{
                console.error('Socket is not connected');
            }
        }
        
    }

    // Helper function
    // function showLoginUI() {
    //     chatApp.style.display = 'none';
    //     loginPage.style.display = 'block';
    // }
    // function showChatUI(username) {
    //     loginPage.style.display = 'none';
    //     chatApp.style.display = 'flex';
    //     if (username) userDisplay.textContent = username;
    // }


    /**
     * Handle when user sends a message
     */
    async function handleSendMessage(messageText, options = {}) {
        if (chatSocket) {
            if(options.type === 'send_message'){
                chatSocket.sendMessage({
                    "action": "send_message",
                    "conversation_id": options.conversation_id,
                    "content": messageText,
                    "reply": options.reply
                });
            } 
            else if(options.type === 'dm'){
                chatSocket.sendMessage({
                    "action": "dm",
                    "to_user_id": options.to_user_id,
                    "content": messageText,
                    "reply": options.reply
                });
            }       
        } 
    }

    /**
     * Display friends list
     */
    async function showFriendsList() {
        console.log('Showing friends list');
        friendsBtn.classList.add('active');
        convosBtn.classList.remove('active');
        const response = await fetch(GET_FRIENDS_URL, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access')
            }
        });
        const data = await response.json();
        const friends = data.data;
        listContainer.innerHTML = '';
        for (const friend of friends) {
            const friendElement = document.createElement('li');
            friendElement.innerHTML = `
                <div class="item-name">${friend.username}</div>
            `;
            // Add event listener when clicking on a friend
            friendElement.addEventListener('click', async () => {
                await handleFriendClick(friend.id, friend.username);
            });
            listContainer.appendChild(friendElement);
        }
    }

    /**
     * Handle when clicking on a friend
     */
    async function handleFriendClick(userId, username) {
        // Delete old messages at first
        currentChatTopic.textContent = username;
        isLoadingMoreMessages = false;
        currentLastMessageId = null;
        try {
            // Check if conversation_id already exists
            const response = await fetch(GET_CONVERSATION_ID_FROM_USER_ID(userId), {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('access')
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const conversationId = data.data && data.data.conversation_id;
                
                if (conversationId) {
                    // Conversation exists, switch to conversation tab and load conversation
                    sendMessageMethod = 'send_message';
                    currentConversationId = conversationId;
                    currentUserId = null; // Reset currentUserId when conversation exists
                    convosBtn.classList.add('active');
                    friendsBtn.classList.remove('active');
                    
                    // Reload conversations list to ensure the newest conversation
                    await showConversationsList();
                    
                    // Load messages of the conversation
                    await showConversationMessages(conversationId);
                } else {
                    // No conversation, switch to DM mode
                    sendMessageMethod = 'dm';
                    currentUserId = userId;
                    currentConversationId = null; // Reset currentConversationId when switching to DM
                }
            } else {
                // API returned an error (possibly no conversation), switch to DM mode
                sendMessageMethod = 'dm';
                currentUserId = userId;
                currentConversationId = null; // Reset currentConversationId when switching to DM
                messageList.innerHTML = '';
            }
        } catch (error) {
            console.error('Error checking conversation:', error);
            // If there's an error, still allow sending DM
            sendMessageMethod = 'dm';
            currentUserId = userId;
            currentConversationId = null; // Reset currentConversationId when switching to DM
            messageList.innerHTML = '';
        }
    }

    /**
     * Load and open the first conversation (after login)
     */
    async function loadAndOpenFirstConversation() {
        try {
            // Load list of conversations
            mapConversationIdToConversation.clear();
            convosBtn.classList.add('active');
            friendsBtn.classList.remove('active');

            const response = await fetch(GET_CONVERSATIONS_URL, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('access')
                }
            });
            const data = await response.json();
            const conversations = data.data || [];
            
            // Save conversations to map
            for (const conversation of conversations) {
                mapConversationIdToConversation.set(conversation.id, conversation);
            }
            
            // Display list of conversations
            showConversations();
            
            // If there are conversations, open the first one (most recent)
            if (conversations.length > 0) {
                // Get all conversations from map and reverse to get the most recent conversation
                const allConversations = Array.from(mapConversationIdToConversation.values());
                allConversations.reverse();
                const firstConversation = allConversations[0]; // Most recent conversation
                
                currentConversationId = firstConversation.id;
                currentChatTopic.textContent = firstConversation.to_user;
                sendMessageMethod = 'send_message';
                await showConversationMessages(firstConversation.id);
            } else {
                // No conversations, clear messages and reset
                messageList.innerHTML = '';
                currentConversationId = null;
                currentChatTopic.textContent = '';
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            messageList.innerHTML = '';
            currentConversationId = null;
            currentChatTopic.textContent = '';
        }
    }

    /**
     * Display list of conversations (Simulated)
     */
    async function showConversationsList() {
        mapConversationIdToConversation.clear();
        console.log('Showing conversations list');
        convosBtn.classList.add('active');
        friendsBtn.classList.remove('active');

        const response = await fetch(GET_CONVERSATIONS_URL, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('access')
            }
        });
        const data = await response.json();
        const conversations = data.data;
        for (const conversation of conversations) {
            mapConversationIdToConversation.set(conversation.id, conversation);
        }
        showConversations();
    }
    

    function showConversations(){
        listContainer.innerHTML = '';
        const allConversations = Array.from(mapConversationIdToConversation.values());

        allConversations.reverse();
        for (const conversation of allConversations) {
            const conversationElement = document.createElement('li');
            conversationElement.innerHTML = `
                <div class="item-name" value="${conversation.id}">${conversation.to_user}</div>
                <div class="item-preview">${conversation.last_message}</div>
            `;
            conversationElement.addEventListener('click', async () => {
                currentConversationId = conversation.id;
                currentChatTopic.textContent = conversation.to_user;
                await showConversationMessages(conversation.id);
            });
            listContainer.appendChild(conversationElement);
        }
    }


    // Display messages of a conversation
    async function showConversationMessages(conversationId) {
        try {
            const response = await fetch(CONVERSATION_MESSAGE_URL(conversationId), {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('access')
                }
            });
            const data = await response.json();
            const messages = data.data.data;
            currentLastMessageId = data.data.last_message_id;
            messageList.innerHTML = '';
            const userId = localStorage.getItem('user_id');
            for (const message of messages) {
                addMessageToUI(message.sender_username, message.content, parseInt(message.sender) === parseInt(userId));
            }
            messageList.scrollTop = messageList.scrollHeight;
        } catch (error) {
            console.error('Error loading messages:', error);
            alert('Không thể tải tin nhắn: ' + error.message);
        }
    }

    // Display more previous messages
    async function showMoreMessages(conversationId, last_message_id) {
        console.log('Showing more messages for conversation:', conversationId, 'with last message id:', last_message_id);
        if (isLoadingMoreMessages || !last_message_id) {
            return null;
        }
        
        isLoadingMoreMessages = true;
        try {
            // Add query parameter last_message_id to URL
            const url = CONVERSATION_MESSAGE_URL(conversationId) + `?last_message_id=${last_message_id}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('access')
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const messages = data.data.data;
            const newLastMessageId = data.data.last_message_id;
            
            if (messages && messages.length > 0) {
                // Save current scroll position
                const oldScrollHeight = messageList.scrollHeight;
                const oldScrollTop = messageList.scrollTop;
                
                // Add messages to the beginning of the list
                const userId = localStorage.getItem('user_id');
                const fragment = document.createDocumentFragment();
                
                // Add messages to fragment in order (from old to new)
                for (const message of messages) {
                    const messageElement = createMessageElement(
                        message.sender_username, 
                        message.content, 
                        parseInt(message.sender) === parseInt(userId)
                    );
                    fragment.appendChild(messageElement);
                }
                
                // Insert fragment at the beginning of messageList
                if (messageList.firstChild) {
                    messageList.insertBefore(fragment, messageList.firstChild);
                } else {
                    messageList.appendChild(fragment);
                }
                
                // Restore scroll position (keep the user's current view)
                const newScrollHeight = messageList.scrollHeight;
                messageList.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
                
                currentLastMessageId = newLastMessageId;
            } else {
                // No more older messages
                currentLastMessageId = null;
            }
            
            return newLastMessageId;
        } catch (error) {
            console.error('Error loading more messages:', error);
            return null;
        } finally {
            isLoadingMoreMessages = false;
        }
    }
    
    // Function to create a message element (extracted for reuse)
    function createMessageElement(sender, text, isSelf = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        
        if (isSelf) {
            messageElement.classList.add('self');
        }

        const safeText = document.createTextNode(text).textContent;

        messageElement.innerHTML = `
            <div class="sender">${sender}</div>
            <div class="text">${safeText}</div>
        `;
        
        return messageElement;
    }   

    // --- Hàm hỗ trợ UI ---

    /**
     * Add a new message to the chat window
     * @param {string} sender 
     * @param {string} text 
     * @param {boolean} isSelf 
     */
    async function addMessageToUI(sender, text, isSelf = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        
        // Add class 'self' if the message is from the current user
        if (isSelf) {
            messageElement.classList.add('self');
        }

        const safeText = document.createTextNode(text).textContent;

        messageElement.innerHTML = `
            <div class="sender">${sender}</div>
            <div class="text">${safeText}</div>
        `;
        
        messageList.appendChild(messageElement);
        
        // Automatically scroll to the newest message
        messageList.scrollTop = messageList.scrollHeight;
    }


    // --- Assign event listeners ---

    // 1. Login form event
    // loginForm.addEventListener('submit', async (e) => {
    //     e.preventDefault();
    //     const username = document.getElementById('username').value;
    //     const password = document.getElementById('password').value;
    //     await handleLogin(username, password);
    // });

    // 2. Register button event
    // registerButton.addEventListener('click', async (e) => {
    //     const username = document.getElementById('username').value;
    //     const password = document.getElementById('password').value;
    //     await handleRegister(username, password);
    // });

    // 3. Logout button event
    // logoutButton.addEventListener('click', async (e) => {
    //     e.preventDefault();
    //     await handleLogout();
    // });

    // 4. Send message form event (Enter or Click)
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const messageText = messageInput.value.trim(); 
        
        if (messageText) { 
            if (sendMessageMethod === 'send_message') {
                var options = {
                    type: sendMessageMethod,
                    conversation_id: currentConversationId,
                    reply: currentReply
                }
            }
            else if (sendMessageMethod === 'dm') {
                var options = {
                    type: sendMessageMethod,
                    to_user_id: currentUserId,
                    reply: currentReply
                }
            }
            console.log(options);
            await handleSendMessage(messageText, options);
            messageInput.value = '';
            messageInput.focus(); 
        }
    });

    // 5. Tab switch event
    friendsBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        sendMessageMethod = 'dm';
        await showFriendsList();
    });
    convosBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        sendMessageMethod = 'send_message';
        await showConversationsList();
    });
    
    // 6. Scroll event to load more old messages
    messageList.addEventListener('scroll', async (e) => {
        if (messageList.scrollTop < 50 && currentConversationId && currentLastMessageId && !isLoadingMoreMessages) {
            await showMoreMessages(currentConversationId, currentLastMessageId);
        }
    });
});