// DTO shape for ride creation - validated manually in service

class CreateRideDto {
  constructor(data = {}) {
    this.pickupLat = data.pickupLat;
    this.pickupLng = data.pickupLng;
    this.pickupAddress = data.pickupAddress;
    this.dropLat = data.dropLat;
    this.dropLng = data.dropLng;
    this.dropAddress = data.dropAddress;
  }
}

module.exports = { CreateRideDto };
