import React, { useState, useEffect, useCallback } from 'react';
import * as semesterService from '../../services/semesterService';
import * as reportPeriodService from '../../services/reportPeriodService';
import { Calendar, Plus, Clock, AlertCircle } from 'lucide-react';

export default function SemesterConfig({ triggerNotification }) {
  const [semesters, setSemesters] = useState([]);
  const [reportPeriods, setReportPeriods] = useState([]);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [isSubmittingSem, setIsSubmittingSem] = useState(false);
  const [isSubmittingPeriod, setIsSubmittingPeriod] = useState(false);

  const [newSem, setNewSem] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [newRp, setNewRp] = useState({ semesterId: '', name: '', description: '', deadline: '' });

  // Load all semesters
  const loadSemesters = useCallback(async () => {
    setLoadingSemesters(true);
    try {
      const data = await semesterService.getSemesters();
      const sList = Array.isArray(data) ? data : (data?.data ?? []);
      setSemesters(sList);
      
      // Auto select the first semester for the period form
      if (sList.length > 0) {
        setNewRp(prev => ({ ...prev, semesterId: String(sList[0].id) }));
      }
    } catch (err) {
      console.error('[SemesterConfig] Lỗi tải học kỳ:', err);
      triggerNotification('Không tải được danh sách học kỳ!', 'error');
    } finally {
      setLoadingSemesters(false);
    }
  }, [triggerNotification]);

  // Load report periods by selected semester
  const loadReportPeriods = useCallback(async (semesterId) => {
    if (!semesterId) return;
    setLoadingPeriods(true);
    try {
      const data = await reportPeriodService.getReportPeriods(semesterId);
      setReportPeriods(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (err) {
      console.error('[SemesterConfig] Lỗi tải đợt báo cáo:', err);
      triggerNotification('Không tải được danh sách đợt báo cáo!', 'error');
      setReportPeriods([]);
    } finally {
      setLoadingPeriods(false);
    }
  }, [triggerNotification]);

  useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  // When semesters are loaded or selection changes, load report periods
  useEffect(() => {
    if (newRp.semesterId) {
      loadReportPeriods(newRp.semesterId);
    }
  }, [newRp.semesterId, loadReportPeriods]);

  const handleCreateSemester = async (e) => {
    e.preventDefault();
    if (!newSem.name || !newSem.startDate || !newSem.endDate) {
      triggerNotification('Vui lòng điền đầy đủ thông tin bắt buộc (Tên học kỳ, Ngày bắt đầu, Ngày kết thúc)!', 'warning');
      return;
    }
    
    setIsSubmittingSem(true);
    try {
      await semesterService.createSemester({
        semesterName: newSem.name,
        description: newSem.description || null,
        startDate: newSem.startDate,
        endDate: newSem.endDate
      });
      triggerNotification(`Đã thiết lập học kỳ mới: ${newSem.name}`, 'success');
      setNewSem({ name: '', description: '', startDate: '', endDate: '' });
      await loadSemesters();
    } catch (err) {
      console.error('[SemesterConfig] Lỗi tạo học kỳ:', err);
      triggerNotification(err?.response?.data?.message || 'Tạo học kỳ thất bại!', 'error');
    } finally {
      setIsSubmittingSem(false);
    }
  };

  const handleCreateReportPeriod = async (e) => {
    e.preventDefault();
    if (!newRp.semesterId || !newRp.name || !newRp.deadline) {
      triggerNotification('Vui lòng điền đầy đủ thông tin đợt báo cáo!', 'warning');
      return;
    }

    setIsSubmittingPeriod(true);
    try {
      await reportPeriodService.createReportPeriod({
        semesterId: parseInt(newRp.semesterId, 10),
        periodName: newRp.name,
        description: newRp.description || null,
        deadline: new Date(newRp.deadline).toISOString()
      });
      triggerNotification(`Đã mở cổng báo cáo: ${newRp.name}`, 'success');
      setNewRp(prev => ({ ...prev, name: '', description: '', deadline: '' }));
      await loadReportPeriods(newRp.semesterId);
    } catch (err) {
      console.error('[SemesterConfig] Lỗi tạo đợt báo cáo:', err);
      triggerNotification(err?.response?.data?.message || 'Tạo đợt báo cáo thất bại!', 'error');
    } finally {
      setIsSubmittingPeriod(false);
    }
  };

  const activeSemester = semesters.find(s => s.status === 'Active' || s.status === 'Open') || semesters[0];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="semester-config-container">
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon-box"><Calendar size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Học kỳ Hiện tại</span>
            <span className="stats-value">
              {activeSemester ? (activeSemester.semesterName || activeSemester.name) : 'N/A'}
            </span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box"><Clock size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Số Đợt Báo cáo Hiện tại</span>
            <span className="stats-value">
              {reportPeriods.length} đợt
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
                <label>Tên học kỳ *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newSem.name} 
                  onChange={e => setNewSem({ ...newSem, name: e.target.value })} 
                  placeholder="Summer 2026"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô tả học kỳ</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newSem.description} 
                  onChange={e => setNewSem({ ...newSem, description: e.target.value })} 
                  placeholder="Mô tả kỳ học..."
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Ngày bắt đầu *</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={newSem.startDate} 
                  onChange={e => setNewSem({ ...newSem, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Ngày kết thúc *</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={newSem.endDate} 
                  onChange={e => setNewSem({ ...newSem, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={isSubmittingSem}>
              <Plus size={16} /> {isSubmittingSem ? 'Đang thêm...' : 'Thêm học kỳ'}
            </button>
          </form>

          {loadingSemesters ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div className="login-spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
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
                      <td>{s.semesterName || s.name}</td>
                      <td>{formatDate(s.startDate)}</td>
                      <td>{formatDate(s.endDate)}</td>
                      <td>
                        <span className={`badge ${
                          s.status === 'Active' || s.status === 'Open' ? 'badge-active' : s.status === 'Finished' ? 'badge-blocked' : 'badge-pending'
                        }`}>
                          {s.status === 'Active' || s.status === 'Open' ? 'Đang diễn ra' : s.status === 'Finished' ? 'Đã kết thúc' : 'Chưa diễn ra'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {semesters.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có học kỳ nào được thiết lập.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Setup Report Gate */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Clock size={18} /> Đợt nộp báo cáo</h3>
          </div>

          <form onSubmit={handleCreateReportPeriod} style={{ marginBottom: '24px' }}>
            <div className="form-group">
              <label>Học kỳ *</label>
              <select 
                className="select-field" 
                value={newRp.semesterId} 
                onChange={e => setNewRp({ ...newRp, semesterId: e.target.value })}
              >
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>{s.semesterName || s.name} ({s.id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Tên đợt báo cáo *</label>
              <input 
                type="text" 
                className="input-field" 
                value={newRp.name} 
                onChange={e => setNewRp({ ...newRp, name: e.target.value })}
                placeholder="VD: Báo cáo giữa kỳ, Báo cáo cuối kỳ"
                required
              />
            </div>

            <div className="form-group">
              <label>Mô tả đợt báo cáo</label>
              <input 
                type="text" 
                className="input-field" 
                value={newRp.description} 
                onChange={e => setNewRp({ ...newRp, description: e.target.value })}
                placeholder="Mô tả..."
              />
            </div>

            <div className="form-group">
              <label>Hạn nộp báo cáo *</label>
              <input 
                type="datetime-local" 
                className="input-field" 
                value={newRp.deadline} 
                onChange={e => setNewRp({ ...newRp, deadline: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmittingPeriod}>
              <Plus size={16} /> {isSubmittingPeriod ? 'Đang tạo...' : 'Tạo đợt báo cáo'}
            </button>
          </form>

          <h4 style={{ marginBottom: '12px' }}>Các đợt báo cáo trong học kỳ đã chọn</h4>
          {loadingPeriods ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div className="login-spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : (
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
                        <div><strong>{r.periodName || r.name}</strong></div>
                        {r.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.description}</div>}
                      </td>
                      <td>{new Date(r.deadline).toLocaleString('vi-VN')}</td>
                      <td>
                        <span className={`badge ${
                          r.status === 'Open' || r.status === 'Active' ? 'badge-active' : r.status === 'Closed' ? 'badge-blocked' : 'badge-pending'
                        }`}>
                          {r.status === 'Open' || r.status === 'Active' ? 'Đang mở cổng' : r.status === 'Closed' ? 'Đã khóa' : 'Lên lịch'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {reportPeriods.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không có đợt báo cáo nào trong học kỳ này.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
