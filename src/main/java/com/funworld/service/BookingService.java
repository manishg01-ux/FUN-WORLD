package com.funworld.service;

import com.funworld.model.Booking;
import com.funworld.model.Ride;
import com.funworld.repository.BookingRepository;
import com.funworld.repository.RideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class BookingService {

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private BookingRepository bookingRepository;

    private final ReentrantLock lock = new ReentrantLock();

    public List<Ride> getAllRides() {
        return rideRepository.findAll();
    }

    /**
     * Thread-safe booking method using ReentrantLock to prevent overbooking.
     */
    public boolean bookRide(Long rideId, int tickets, String userName, String userEmail, String userPhone) {
        lock.lock();
        try {
            Ride ride = rideRepository.findById(rideId).orElse(null);
            if (ride != null && ride.getAvailableSlots() >= tickets) {
                // Update ride slots in H2
                ride.setAvailableSlots(ride.getAvailableSlots() - tickets);
                rideRepository.save(ride);

                // Save booking details to MongoDB
                try {
                    Booking booking = new Booking(rideId, ride.getName(), userName, userEmail, userPhone, tickets);
                    bookingRepository.save(booking);
                } catch (Exception e) {
                    throw new RuntimeException("MongoDB connection failed. Please ensure MongoDB is running.");
                }

                return true;
            }
            return false;
        } finally {
            lock.unlock();
        }
    }

    public void initializeRides() {
        if (rideRepository.count() == 0) {
            rideRepository.save(new Ride(null, "Giant Wheel", "Thrilling rides for all ages.", "Amusement Park", 50, "images/amusement_park.png", 599.0));
            rideRepository.save(new Ride(null, "Wave Pool", "Dive into excitement.", "Water Park", 30, "images/water_park.png", 799.0));
            rideRepository.save(new Ride(null, "Ice Slider", "A magical icy experience.", "Snow City", 20, "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&q=80&w=600", 999.0));
            rideRepository.save(new Ride(null, "Shark Tunnel", "Explore breathtaking marine life.", "Aquarium Paradise", 40, "images/aquarium.jpg", 699.0));
            rideRepository.save(new Ride(null, "Roller Coaster", "The ultimate thrill.", "Amusement Park", 25, "images/hero.png", 899.0));
            rideRepository.save(new Ride(null, "Toy Train", "A fun ride for kids.", "Amusement Park", 15, "images/toy_train.png", 399.0));
        }
    }
}
