package com.funworld.controller;

import com.funworld.model.Ride;
import com.funworld.service.BookingService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class RideController {

    @Autowired
    private BookingService bookingService;

    @PostConstruct
    public void init() {
        bookingService.initializeRides();
    }

    @GetMapping("/rides")
    public List<Ride> getRides() {
        return bookingService.getAllRides();
    }

    @PostMapping("/book")
    public Map<String, Object> bookRide(@RequestBody Map<String, Object> payload) {
        try {
            Long rideId = Long.valueOf(payload.get("rideId").toString());
            int tickets = Integer.parseInt(payload.get("tickets").toString());
            String userName = payload.get("userName").toString();
            String userEmail = payload.get("userEmail").toString();
            String userPhone = payload.get("userPhone").toString();
            
            boolean success = bookingService.bookRide(rideId, tickets, userName, userEmail, userPhone);
            
            if (success) {
                return Map.of("success", true, "message", "Booking successful! Your adventure awaits.");
            } else {
                return Map.of("success", false, "message", "Booking failed. Not enough slots available.");
            }
        } catch (Exception e) {
            return Map.of("success", false, "message", "Error: " + e.getMessage());
        }
    }
}
