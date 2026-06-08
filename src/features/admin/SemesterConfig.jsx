import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import { Calendar, Plus, Clock, AlertCircle } from 'lucide-react';

export default function SemesterConfig({ dbData, triggerNotification }) {
  const { semesters, reportPeriods } = dbData;
  const [newSem, setNewSem] = useState({ id: '', name: '', startDate: '', endDate: '' });
  const [newRp, setNewRp] = useState({ semesterId: semesters[0]?.id || '', name: '', startDate: '', endDate: '', deadline: '' });

  const handleCreateSemester = (e) => {
    e.preventDefault();
    if (!newSem.id || !newSem.name || !newSem.startDate || !newSem.endDate) {
      triggerNotification('Vui lòng điền đầy đủ thông tin học kỳ!', 'warning');
      return;
    }
    
    // Check if ID already exists
    if (semesters.some(s => s.id.toLowerCase() === newSem.id.toLowerCase())) {
      triggerNotification('Mã học kỳ đã tồn tại!', 'error');
      return;
    }

    mockDb.addSemester(newSem);
    triggerNotification(`Đã thiết lập học kỳ mới: ${newSem.name}`, 'success');
    setNewSem({ id: '', name: '', startDate: '', endDate: '' });
  };

  const handleCreateReportPeriod = (e) => {
    e.preventDefault();
    if (!newRp.semesterId || !newRp.name || !newRp.startDate || !newRp.endDate || !newRp.deadline) {
      triggerNotification('Vui lòng điền đầy đủ thông tin đợt báo cáo!', 'warning');
      return;
    }

    mockDb.addReportPeriod(newRp);
    triggerNotification(`Đã mở cổng báo cáo: ${newRp.name}`, 'success');
    setNewRp({ semesterId: semesters[0]?.id || '', name: '', startDate: '', endDate: '', deadline: '' });
  };

  return (
    <div className="semester-config-container">
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon-box"><Calendar size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Học kỳ Hiện tại</span>
            <span className="stats-value">
              {semesters.find(s => s.status === 'Active')?.name || 'N/A'}
            </span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box"><Clock size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Số Đợt Báo cáo Active</span>
            <span className="stats-value">
              {reportPeriods.filter(r => r.status === 'Open').length} đợt
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2col">
        {/* Left Side: Create Semester Form & List */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Calendar size={18} /> Danh sách Học kỳ</h3>
          </div>
          
          <form onSubmit={handleCreateSemester} style={{ marginBottom: '24px' }}>
            <div className="form-row">
              <div className="form-group">
                <label>Mã học kỳ (VD: SU26, FA26)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newSem.id} 
                  onChange={e => setNewSem({ ...newSem, id: e.target.value.toUpperCase() })} 
                  placeholder="SU26"
                />
              </div>
              <div className="form-group">
                <label>Tên học kỳ</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newSem.name} 
                  onChange={e => setNewSem({ ...newSem, name: e.target.value })} 
                  placeholder="Summer 2026"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Ngày bắt đầu</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={newSem.startDate} 
                  onChange={e => setNewSem({ ...newSem, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Ngày kết thúc</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={newSem.endDate} 
                  onChange={e => setNewSem({ ...newSem, endDate: e.target.value })}
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Thêm học kỳ
            </button>
          </form>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Mã kỳ</th>
                  <th>Tên học kỳ</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {semesters.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.id}</strong></td>
                    <td>{s.name}</td>
                    <td>{s.startDate}</td>
                    <td>{s.endDate}</td>
                    <td>
                      <span className={`badge ${
                        s.status === 'Active' ? 'badge-active' : s.status === 'Finished' ? 'badge-blocked' : 'badge-pending'
                      }`}>
                        {s.status === 'Active' ? 'Đang diễn ra' : s.status === 'Finished' ? 'Đã kết thúc' : 'Chưa diễn ra'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Setup Report Gate */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Clock size={18} /> Đợt nộp báo cáo</h3>
          </div>

          <form onSubmit={handleCreateReportPeriod} style={{ marginBottom: '24px' }}>
            <div className="form-group">
              <label>Học kỳ</label>
              <select 
                className="select-field" 
                value={newRp.semesterId} 
                onChange={e => setNewRp({ ...newRp, semesterId: e.target.value })}
              >
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tên đợt báo cáo</label>
              <input 
                type="text" 
                className="input-field" 
                value={newRp.name} 
                onChange={e => setNewRp({ ...newRp, name: e.target.value })}
                placeholder="VD: Báo cáo giữa kỳ, Báo cáo tháng 6"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Ngày bắt đầu nhận</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={newRp.startDate} 
                  onChange={e => setNewRp({ ...newRp, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Ngày kết thúc nhận</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={newRp.endDate} 
                  onChange={e => setNewRp({ ...newRp, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Hạn nộp báo cáo</label>
              <input 
                type="date" 
                className="input-field" 
                value={newRp.deadline} 
                onChange={e => setNewRp({ ...newRp, deadline: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Plus size={16} /> Tạo đợt báo cáo
            </button>
          </form>

          <h4 style={{ marginBottom: '12px' }}>Các đợt báo cáo</h4>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tên đợt</th>
                  <th>Hạn nộp</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {reportPeriods.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div><strong>{r.name}</strong></div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kỳ: {r.semesterId}</div>
                    </td>
                    <td>{r.deadline}</td>
                    <td>
                      <span className={`badge ${
                        r.status === 'Open' ? 'badge-active' : r.status === 'Closed' ? 'badge-blocked' : 'badge-pending'
                      }`}>
                        {r.status === 'Open' ? 'Đang mở cổng' : r.status === 'Closed' ? 'Đã khóa' : 'Lên lịch'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
