import React, { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';

// [⚠ BE MISSING API - TOÀN BỘ TRANG NÀY DÙNG MOCK DATA]
// BE cần bổ sung các API sau để trang Quản lý Phòng ban hoạt động thật:
//   GET    /api/departments              - Lấy danh sách phòng ban
//   POST   /api/departments              - Tạo phòng ban mới  { name, code, description, head }
//   PUT    /api/departments/{id}         - Cập nhật phòng ban { name, code, description, head }
//   DELETE /api/departments/{id}         - Xóa phòng ban
// Khi BE có API, thay MOCK_DEPARTMENTS bằng useEffect + fetch từ API thật.

const MOCK_DEPARTMENTS = [
  { id: 1, name: 'Phòng Đào tạo và Phát triển (PDP)', code: 'PDP', description: 'Đơn vị quản lý hoạt động sinh viên và câu lạc bộ', head: 'Nguyễn Văn A', status: 'Active' },
  { id: 2, name: 'Phòng Công tác Sinh viên', code: 'SWD', description: 'Hỗ trợ sinh hoạt và phúc lợi sinh viên', head: 'Trần Thị B', status: 'Active' },
  { id: 3, name: 'Phòng Truyền thông', code: 'COMM', description: 'Quản lý thông tin và truyền thông nội bộ', head: 'Lê Văn C', status: 'Active' },
];

export default function DepartmentManagement({ triggerNotification }) {
  const [departments, setDepartments] = useState(MOCK_DEPARTMENTS);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', head: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      triggerNotification('Vui lòng nhập tên và mã phòng ban!', 'warning');
      return;
    }

    if (editingId) {
      setDepartments(prev => prev.map(d =>
        d.id === editingId ? { ...d, ...form } : d
      ));
      triggerNotification(`Đã cập nhật phòng ban: ${form.name}`, 'success');
    } else {
      const newDept = { id: Date.now(), ...form, status: 'Active' };
      setDepartments(prev => [...prev, newDept]);
      triggerNotification(`Đã thêm phòng ban mới: ${form.name}`, 'success');
    }

    setForm({ name: '', code: '', description: '', head: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (dept) => {
    setEditingId(dept.id);
    setForm({ name: dept.name, code: dept.code, description: dept.description, head: dept.head });
    setShowForm(true);
  };

  const handleDelete = (dept) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phòng ban "${dept.name}"?`)) return;
    setDepartments(prev => prev.filter(d => d.id !== dept.id));
    triggerNotification(`Đã xóa phòng ban: ${dept.name}`, 'success');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', code: '', description: '', head: '' });
  };

  return (
    <div>
      {/* ⚠ BE MISSING API BANNER */}
      <div style={{
        marginBottom: '20px', padding: '16px 20px',
        borderRadius: '10px',
        background: 'rgba(234,179,8,0.08)',
        border: '1.5px solid rgba(234,179,8,0.4)',
        display: 'flex', gap: '12px', alignItems: 'flex-start'
      }}>
        <AlertTriangle size={18} style={{ color: '#eab308', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 700, color: '#eab308', fontSize: '13px', marginBottom: '6px' }}>
            ⚠ [BE CẦN BỔ SUNG API] — Trang này đang dùng Mock Data
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            Chức năng Quản lý Phòng Ban chưa thể kết nối thật vì Backend chưa có các API sau:
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
              <li><code>GET &nbsp;&nbsp;/api/departments</code> — Lấy danh sách phòng ban</li>
              <li><code>POST &nbsp;/api/departments</code> — Tạo phòng ban mới <code>{'{ name, code, description, head }'}</code></li>
              <li><code>PUT &nbsp;&nbsp;/api/departments/{'{id}'}</code> — Cập nhật thông tin phòng ban</li>
              <li><code>DELETE /api/departments/{'{id}'}</code> — Xóa phòng ban</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2col">
        {/* List */}
        <div className="glass-card">
          <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="glass-card-title"><Building2 size={18} /> Danh sách Phòng ban ({departments.length})</h3>
            {!showForm && (
              <button
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', code: '', description: '', head: '' }); }}
              >
                <Plus size={14} /> Thêm mới
              </button>
            )}
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên Phòng ban</th>
                  <th>Trưởng phòng</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <tr key={dept.id}>
                    <td><span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>{dept.code}</span></td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{dept.name}</div>
                      {dept.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{dept.description}</div>}
                    </td>
                    <td>{dept.head || '—'}</td>
                    <td><span className="badge badge-active">Hoạt động</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => handleEdit(dept)}>
                          <Pencil size={12} />
                        </button>
                        <button className="btn btn-sm" style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)' }} onClick={() => handleDelete(dept)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có phòng ban nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <div className="glass-card-header">
              <h3 className="glass-card-title">
                <Plus size={18} /> {editingId ? 'Cập nhật Phòng ban' : 'Thêm Phòng ban mới'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tên Phòng ban <span style={{ color: 'var(--error)' }}>*</span></label>
                <input
                  type="text"
                  className="input-field"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Phòng Đào tạo và Phát triển"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Mã Phòng ban <span style={{ color: 'var(--error)' }}>*</span></label>
                <input
                  type="text"
                  className="input-field"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="PDP, SWD..."
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Trưởng phòng</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.head}
                  onChange={e => setForm({ ...form, head: e.target.value })}
                  placeholder="Họ và tên trưởng phòng..."
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Mô tả</label>
                <textarea
                  className="textarea-field"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả chức năng phòng ban..."
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>Hủy</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
