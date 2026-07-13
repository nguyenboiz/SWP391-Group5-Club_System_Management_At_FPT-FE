import React from 'react';
import NotificationManagement from '../../features/shared/NotificationManagement';

export default function NotificationManagementPage({ triggerNotification }) {
  return <NotificationManagement triggerNotification={triggerNotification} />;
}
