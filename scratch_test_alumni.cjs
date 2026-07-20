const axios = require('axios');

const BASE_URL = 'https://swp391-group5-club-system-management-at.onrender.com';

async function test() {
  try {
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, { username: 'admin01', password: 'admin01' });
    const token = loginRes.data?.accessToken || loginRes.data?.token || loginRes.data;
    
    // Get clubs
    const clubsRes = await axios.get(`${BASE_URL}/api/clubs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const list = Array.isArray(clubsRes.data) ? clubsRes.data : (clubsRes.data?.data ?? []);
    if (list.length > 0) {
      const clubId = list[0].id || list[0].clubId;
      console.log(`Using club ID: ${clubId}`);
      
      // Get alumni
      const alumniRes = await axios.get(`${BASE_URL}/api/clubs/${clubId}/alumni`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Alumni response keys & data:');
      console.log(JSON.stringify(alumniRes.data, null, 2));
    }
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

test();
