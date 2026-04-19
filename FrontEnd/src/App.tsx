import { App as AntApp, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { AppRouter } from './app/AppRouter';
import { bootstrapData } from './services/bootstrapService';
import { useAppStore } from './store/appStore';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import './styles/theme.css';

function App() {
  const loadAll = useAppStore((s) => s.loadAll);

  useEffect(() => {
    bootstrapData();
    loadAll();
  }, [loadAll]);

  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: '#2f6f3e',
          borderRadius: 12,
          fontFamily: '"PT Sans", "Segoe UI", sans-serif',
        },
      }}
    >
      <AntApp>
        <AppErrorBoundary>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </AppErrorBoundary>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;


