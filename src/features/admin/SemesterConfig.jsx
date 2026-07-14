import React, { useState, useEffect, useCallback } from 'react';
import * as semesterService from '../../services/semesterService';
import * as reportPeriodService from '../../services/reportPeriodService';
import { Calendar, Plus, Clock, AlertCircle, Edit, X, Save } from 'lucide-react';

export default function SemesterConfig({ triggerNotification }) {
  const [semesters, setSemesters] = useState([]);
  const [reportPeriods, setReportPeriods] = useState([]);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [isSubmittingSem, setIsSubmittingSem] = useState(false);
  const [isSubmittingPeriod, setIsSubmittingPeriod] = useState(false);

  const [newSem, setNewSem] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [newRp, setNewRp] = useState({ semesterId: '', name: '', description: '', deadline: '' });

  // Edit semester
  const [showEditSemModal, setShowEditSemModal] = useState(false);
  const [editingSem, setEditingSem] = useState(null);
  const [isUpdatingSem, setIsUpdatingSem] = useState(false);

  // Edit report period
  const [showEditPeriodModal, setShowEditPeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [isUpdatingPeriod, setIsUpdatingPeriod] = useState(false);


  // Load all semesters
  const loadSemesters = useCallback(async () => {
    setLoadingSemesters(true);
    try {
      const data = await semesterService.getSemesters();
      const sList = Array.isArray(data) ? data : (data?.data ?? []);
      setSemesters(sList);
      if (sList.length > 0) {
        setNewRp(prev => ({ ...prev, semesterId: String(sList[0].id) }));
      }
    } catch (err) {
      setSemesters([]);
    } finally {
      setLoadingSemesters(false);
    }
  }, []);

  // Load report periods by selected semester
  const loadReportPeriods = useCallback(async (semesterId) => {
    if (!semesterId) return;
    setLoadingPeriods(true);
    try {
      const data = await reportPeriodService.getReportPeriods(semesterId);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setReportPeriods(list);
    } catch (err) {
      setReportPeriods([]);
    } finally {
      setLoadingPeriods(false);
    }
  }, []);

  useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  // When semesters are loaded or selection changes, load report periods
  useEffect(() => {
    if (newRp.semesterId) {
      loadReportPeriods(newRp.semesterId);
    }
  }, [newRp.semesterId, loadReportPeriods]);

  const handleUpdateSemester = async (e) => {
    e.preventDefault();
    if (!editingSem) return;
    setIsUpdatingSem(true);
    try {
      await semesterService.updateSemester(editingSem.id, {
        semesterName: editingSem.semesterName,
        description: editingSem.description || null,
        startDate: editingSem.startDate,
        endDate: editingSem.endDate,
        status: editingSem.status
      });
      triggerNotification(`Đã cập nhật học kỳ: ${editingSem.semesterName}`, 'success');
      setShowEditSemModal(false);
      setEditingSem(null);
      await loadSemesters();
    } catch (err) {
      triggerNotification(err?.response?.data?.message || 'Cập nhật học kỳ thất bại!', 'error');
    } finally {
      setIsUpdatingSem(false);
    }
  };

  const handleUpdateReportPeriod = async (e) => {
    e.preventDefault();
    if (!editingPeriod) return;
    setIsUpdatingPeriod(true);
    try {
      await reportPeriodService.updateReportPeriod(editingPeriod.id, {
        semesterId: editingPeriod.semesterId,
        periodName: editingPeriod.periodName,
        description: editingPeriod.description || null,
        deadline: editingPeriod.deadline,
        status: editingPeriod.status
      });
      triggerNotification(`Đã cập nhật đợt báo cáo: ${editingPeriod.periodName}`, 'success');
      setShowEditPeriodModal(false);
      setEditingPeriod(null);
      await loadReportPeriods(editingPeriod.semesterId);
    } catch (err) {
      triggerNotification(err?.response?.data?.message || 'Cập nhật đợt báo cáo thất bại!', 'error');
    } finally {
      setIsUpdatingPeriod(false);
    }
  };

  const handleCreateSemester = async (e) => {
    e.preventDefault();
    const now = new Date();
    if (!newSem.name.trim()) {
      triggerNotification('❌ Vui lòng nhập Tên học kỳ!', 'warning');
      return;
    }
    if (!newSem.startDate) {
      triggerNotification('❌ Vui lòng chọn Ngày bắt đầu học kỳ!', 'warning');
      return;
    }
    if (new Date(newSem.startDate) < now) {
      triggerNotification('❌ Ngày bắt đầu học kỳ không được là ngày trong quá khứ!', 'warning');
      return;
    }
    if (!newSem.endDate) {
      triggerNotification('❌ Vui lòng chọn Ngày kết thúc học kỳ!', 'warning');
      return;
    }
    if (newSem.endDate <= newSem.startDate) {
      triggerNotification('❌ Ngày kết thúc phải sau ngày bắt đầu!', 'warning');
      return;
    }
    
    setIsSubmittingSem(true);
    try {
      await semesterService.createSemester({
        semesterName: newSem.name.trim(),
        description: newSem.description || null,
        startDate: newSem.startDate,
        endDate: newSem.endDate
      });
      triggerNotification(`✅ Đã thiết lập học kỳ mới: ${newSem.name}`, 'success');
      setNewSem({ name: '', description: '', startDate: '', endDate: '' });
      await loadSemesters();
    } catch (err) {
      console.error('[SemesterConfig] Lỗi tạo học kỳ:', err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.response?.data?.title;
      if (status === 400) triggerNotification(`❌ Dữ liệu không hợp lệ: ${serverMsg || 'Kiểm tra lại thông tin!'}`, 'error');
      else if (status === 403) triggerNotification('❌ Bạn không có quyền thực hiện thao tác này!', 'error');
      else triggerNotification(`❌ Tạo học kỳ thất bại: ${serverMsg || 'Lỗi máy chủ, vui lòng thử lại!'}`, 'error');
    } finally {
      setIsSubmittingSem(false);
    }
  };

  const handleCreateReportPeriod = async (e) => {
    e.preventDefault();
    const now = new Date();
    if (!newRp.semesterId) {
      triggerNotification('❌ Vui lòng chọn Học kỳ trước khi tạo đợt báo cáo!', 'warning');
      return;
    }
    if (!newRp.name.trim()) {
      triggerNotification('❌ Vui lòng nhập Tên đợt báo cáo!', 'warning');
      return;
    }
    if (!newRp.deadline) {
      triggerNotification('❌ Vui lòng chọn Hạn nộp báo cáo!', 'warning');
      return;
    }
    if (new Date(newRp.deadline) <= now) {
      triggerNotification('❌ Hạn nộp báo cáo phải là thời điểm trong tương lai!', 'warning');
      return;
    }

    setIsSubmittingPeriod(true);
    try {
      await reportPeriodService.createReportPeriod({
        semesterId: parseInt(newRp.semesterId, 10),
        periodName: newRp.name.trim(),
        description: newRp.description || null,
        deadline: new Date(newRp.deadline).toISOString()
      });
      triggerNotification(`✅ Đã mở cổng báo cáo: ${newRp.name}`, 'success');
      setNewRp(prev => ({ ...prev, name: '', description: '', deadline: '' }));
      await loadReportPeriods(newRp.semesterId);
    } catch (err) {
      console.error('[SemesterConfig] Lỗi tạo đợt báo cáo:', err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.response?.data?.title;
      if (status === 400) triggerNotification(`❌ Dữ liệu không hợp lệ: ${serverMsg || 'Kiểm tra lại!'}`, 'error');
      else if (status === 403) triggerNotification('❌ Bạn không có quyền thực hiện thao tác này!', 'error');
      else triggerNotification(`❌ Tạo đợt báo cáo thất bại: ${serverMsg || 'Lỗi máy chủ, vui lòng thử lại!'}`, 'error');
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
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
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
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => { setEditingSem({ ...s, semesterName: s.semesterName || s.name }); setShowEditSemModal(true); }}
                        >
                          <Edit size={12} /> Sửa
                        </button>
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
              <label>Hạn nộp báo cáo <span style={{ color: 'var(--error, #ef4444)' }}>*</span></label>
              <input 
                type="datetime-local" 
                className="input-field" 
                value={newRp.deadline} 
                onChange={e => setNewRp({ ...newRp, deadline: e.target.value })}
              />
              {!newRp.deadline && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>Bắt buộc — chọn ngày giờ hạn nộp báo cáo</span>}
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
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
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
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            const dl = r.deadline ? r.deadline.slice(0, 16) : '';
                            setEditingPeriod({ ...r, periodName: r.periodName || r.name, deadline: dl });
                            setShowEditPeriodModal(true);
                          }}
                        >
                          <Edit size={12} /> Sửa
                        </button>
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

      {/* MODAL: SỬA HỌC KỲ */}
      {showEditSemModal && editingSem && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title"><Edit size={16} style={{ marginRight: '6px' }} /> Sửa Học kỳ</h3>
              <button className="modal-close" onClick={() => { setShowEditSemModal(false); setEditingSem(null); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateSemester} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              <div className="form-group">
                <label>Tên học kỳ *</label>
                <input type="text" className="input-field" value={editingSem.semesterName}
                  onChange={e => setEditingSem({ ...editingSem, semesterName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <input type="text" className="input-field" value={editingSem.description || ''}
                  onChange={e => setEditingSem({ ...editingSem, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ngày bắt đầu *</label>
                  <input type="date" className="input-field" value={editingSem.startDate?.slice(0,10) || ''}
                    onChange={e => setEditingSem({ ...editingSem, startDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Ngày kết thúc *</label>
                  <input type="date" className="input-field" value={editingSem.endDate?.slice(0,10) || ''}
                    onChange={e => setEditingSem({ ...editingSem, endDate: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select className="select-field" value={editingSem.status || 'Planned'}
                  onChange={e => setEditingSem({ ...editingSem, status: e.target.value })}>
                  <option value="Planned">Chưa diễn ra (Planned)</option>
                  <option value="Active">Đang diễn ra (Active)</option>
                  <option value="Finished">Đã kết thúc (Finished)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isUpdatingSem}>
                  <Save size={14} /> {isUpdatingSem ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEditSemModal(false); setEditingSem(null); }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SỬA ĐỢT BÁO CÁO */}
      {showEditPeriodModal && editingPeriod && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title"><Edit size={16} style={{ marginRight: '6px' }} /> Sửa Đợt Báo cáo</h3>
              <button className="modal-close" onClick={() => { setShowEditPeriodModal(false); setEditingPeriod(null); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateReportPeriod} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              <div className="form-group">
                <label>Tên đợt báo cáo *</label>
                <input type="text" className="input-field" value={editingPeriod.periodName}
                  onChange={e => setEditingPeriod({ ...editingPeriod, periodName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <input type="text" className="input-field" value={editingPeriod.description || ''}
                  onChange={e => setEditingPeriod({ ...editingPeriod, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Hạn nộp *</label>
                <input type="datetime-local" className="input-field" value={editingPeriod.deadline}
                  onChange={e => setEditingPeriod({ ...editingPeriod, deadline: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Trạng thái</label>
                <select className="select-field" value={editingPeriod.status || 'Planned'}
                  onChange={e => setEditingPeriod({ ...editingPeriod, status: e.target.value })}>
                  <option value="Planned">Lên lịch (Planned)</option>
                  <option value="Open">Đang mở cổng (Open)</option>
                  <option value="Closed">Đã khóa (Closed)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isUpdatingPeriod}>
                  <Save size={14} /> {isUpdatingPeriod ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEditPeriodModal(false); setEditingPeriod(null); }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
