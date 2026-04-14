// DTO shapes for driver updates - validated manually in service

class UpdateDriverStatusDto {
  constructor(data = {}) {
    this.status = data.status; // 'ONLINE' | 'OFFLINE' | 'BUSY'
  }
}

class UpdateDriverProfileDto {
  constructor(data = {}) {
    this.vehicleName = data.vehicleName;
    this.vehiclePlate = data.vehiclePlate;
  }
}

module.exports = { UpdateDriverStatusDto, UpdateDriverProfileDto };
