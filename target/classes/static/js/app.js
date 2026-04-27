let allRides = [];
let currentRide = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchRides();
});

async function fetchRides() {
    try {
        const response = await fetch('/api/rides');
        allRides = await response.json();
        displayRides(allRides);
    } catch (error) {
        console.error('Error fetching rides:', error);
        document.getElementById('rides-container').innerHTML = '<p>Failed to load rides. Please try again later.</p>';
    }
}

function displayRides(rides) {
    const container = document.getElementById('rides-container');
    container.innerHTML = '';

    rides.forEach(ride => {
        const card = document.createElement('div');
        card.className = 'ride-card';
        card.innerHTML = `
            <img src="${ride.imageUrl || getRideImage(ride.name)}" alt="${ride.name}">
            <div class="ride-content">
                <span class="ride-tag">${ride.category}</span>
                <h3>${ride.name}</h3>
                <p>${ride.description}</p>
                <div class="ride-price" style="font-weight: 800; color: var(--primary-blue); font-size: 1.2rem; margin: 0.5rem 0;">₹${ride.price}</div>
                <div class="ride-slots">Available Slots: <span id="slots-${ride.id}">${ride.availableSlots}</span></div>
                <div class="booking-controls">
                    <input type="number" id="tickets-${ride.id}" value="1" min="1" max="${ride.availableSlots}">
                    <button class="btn-book" onclick="openBookingModal(${ride.id})" ${ride.availableSlots <= 0 ? 'disabled' : ''}>
                        ${ride.availableSlots <= 0 ? 'Full' : 'Book Now'}
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function openBookingModal(rideId) {
    console.log('Attempting to open booking modal for ride:', rideId);
    try {
        // Use loose equality (==) in case rideId is passed as a string/number mismatch
        currentRide = allRides.find(r => r.id == rideId);
        
        if (!currentRide) {
            console.error('Ride not found in allRides array:', rideId);
            showModal('Error', 'Ride details not found. Please refresh the page and try again.');
            return;
        }

        const ticketsInput = document.getElementById(`tickets-${rideId}`);
        let tickets = parseInt(ticketsInput ? ticketsInput.value : 1);

        if (isNaN(tickets) || tickets <= 0) {
            showModal('Invalid Input', 'Please enter a valid number of tickets.');
            return;
        }

        // Set Initial Modal State
        document.getElementById('booking-ride-id').value = rideId;
        document.getElementById('booking-tickets').value = tickets;
        document.getElementById('display-ride-name').innerText = currentRide.name || 'Selected Ride';
        document.getElementById('display-ride-price').innerText = `₹ ${(currentRide.price || 0).toFixed(2)}`;
        document.getElementById('display-qty').innerText = tickets;
        
        // Set Display Date (default to 3 days from now)
        const date = new Date();
        date.setDate(date.getDate() + 3);
        document.getElementById('booking-date-display').innerText = date.toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });

        updateModalSummary();
        
        const modal = document.getElementById('booking-modal');
        if (modal) {
            modal.style.display = 'flex';
            console.log('Booking modal opened successfully');
        } else {
            console.error('Booking modal element not found!');
        }
    } catch (error) {
        console.error('Critical error in openBookingModal:', error);
        showModal('System Error', 'Unable to open the booking window. Please try again.');
    }
}

function changeQty(delta) {
    let currentQty = parseInt(document.getElementById('display-qty').innerText);
    let newQty = currentQty + delta;
    
    if (newQty >= 1 && newQty <= currentRide.availableSlots) {
        document.getElementById('display-qty').innerText = newQty;
        document.getElementById('booking-tickets').value = newQty;
        updateModalSummary();
    }
}

function updateModalSummary() {
    const qty = parseInt(document.getElementById('display-qty').innerText);
    const pricePerTicket = currentRide.price;
    const subtotal = qty * pricePerTicket;
    const convenienceFee = 50.00;
    const taxRate = 0.18; // 18% GST
    const taxes = subtotal * taxRate;
    const grandTotal = subtotal + convenienceFee + taxes;

    document.getElementById('booking-visitors-display').innerHTML = `<i class="fas fa-user"></i> ${qty}`;
    document.getElementById('booking-total-display').innerText = `₹ ${grandTotal.toFixed(2)}`;
    document.getElementById('display-taxes').innerText = `₹ ${taxes.toFixed(2)}`;
    document.getElementById('display-grand-total').innerText = `₹ ${grandTotal.toFixed(2)}`;
}

function closeBookingModal() {
    document.getElementById('booking-modal').style.display = 'none';
}

async function submitBooking(event) {
    event.preventDefault();
    
    if (!document.getElementById('terms').checked) {
        showModal('Terms Required', 'Please agree to the Terms & Conditions to proceed.');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerText;
    
    submitBtn.innerText = 'PROCESSING...';
    submitBtn.disabled = true;

    const rideId = document.getElementById('booking-ride-id').value;
    const tickets = document.getElementById('booking-tickets').value;
    const userName = document.getElementById('userName').value;
    const userEmail = document.getElementById('userEmail').value;
    const userPhone = document.getElementById('userPhone').value;

    try {
        const response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rideId, tickets, userName, userEmail, userPhone })
        });

        const result = await response.json();

        if (result.success) {
            closeBookingModal();
            showTicketModal(currentRide.name, userName, tickets);
            document.getElementById('booking-form').reset();
            fetchRides();
        } else {
            showModal('Booking Failed', result.message);
        }
    } catch (error) {
        console.error('Error booking ride:', error);
        showModal('Error', 'Could not connect to the server.');
    } finally {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
}

function getRideImage(name) {
    const images = {
        'Giant Wheel': 'images/amusement_park.png',
        'Wave Pool': 'images/water_park.png',
        'Ice Slider': 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&q=80&w=600',
        'Shark Tunnel': 'images/aquarium.jpg',
        'Roller Coaster': 'images/hero.png',
        'Toy Train': 'images/toy_train.png'
    };
    return images[name] || 'https://via.placeholder.com/600x400?text=Fun+World+Ride';
}

function showModal(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function showTicketModal(rideName, userName, visitors) {
    const bookingId = 'FW-' + Math.floor(Math.random() * 90000 + 10000);
    const date = document.getElementById('booking-date-display').innerText;
    
    document.getElementById('ticket-id').innerText = bookingId;
    document.getElementById('ticket-date').innerText = date;
    document.getElementById('ticket-ride-name').innerText = rideName || 'Amusement Ride';
    document.getElementById('ticket-user-name').innerText = userName;
    document.getElementById('ticket-visitors').innerText = visitors;
    
    document.getElementById('ticket-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingId}-${visitors}`;
    
    document.getElementById('ticket-modal').style.display = 'flex';
}

function closeTicketModal() {
    document.getElementById('ticket-modal').style.display = 'none';
}
