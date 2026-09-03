const make = 'Cadillac';
const model = 'CTS';
const year = '2012';
const url = 'https://api.nhtsa.gov/complaints/complaintsByVehicle?make=' + encodeURIComponent(make) + '&model=' + encodeURIComponent(model) + '&modelYear=' + encodeURIComponent(year);
console.log(url);
