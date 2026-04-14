// DTO shape for registration - validated manually in service
// Using plain classes since Babel legacy decorators don't support property decorators

class RegisterDto {
  constructor(data = {}) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.phone = data.phone;
    this.role = data.role || 'RIDER';
    this.vehicleName = data.vehicleName;
    this.vehiclePlate = data.vehiclePlate;
  }
}

module.exports = { RegisterDto };
