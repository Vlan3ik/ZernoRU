import { App as AntApp, ConfigProvider, Result, Spin } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './app/AppRouter';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { useAppStore } from './store/appStore';
import './styles/theme.css';

function App() {
  const loadAll = useAppStore((state) => state.loadAll);
  const [bootState, setBootState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let alive = true;

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    void (async () => {
      const attempts = 6;
      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
          await loadAll();
          if (alive) {
            setBootState('ready');
          }
          return;
        } catch (error) {
          console.error(`Failed to load portal snapshot (attempt ${attempt}/${attempts})`, error);
          if (!alive) return;
          if (attempt < attempts) {
            await delay(1500 * attempt);
            continue;
          }
          setBootState('error');
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [loadAll]);

  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        token: {
          colorPrimary: '#2e8b4b',
          colorSuccess: '#1f8a45',
          colorInfo: '#2e7de0',
          colorWarning: '#d9a52c',
          colorError: '#d94e4e',
          borderRadius: 14,
          borderRadiusLG: 18,
          fontFamily: 'Inter, "SF Pro Display", "Segoe UI", Roboto, Arial, sans-serif',
        },
      }}
    >
      <AntApp>
        <AppErrorBoundary>
          {bootState === 'loading' && (
            <div className="app-bootstrap-screen">
              <Spin size="large" />
              <div>
                <strong>Загрузка портала</strong>
                <div>Поднимаем snapshot данных, лоты, форум, справочники и сервисные разделы.</div>
              </div>
            </div>
          )}
          {bootState === 'error' && (
            <div className="app-bootstrap-screen">
              <Result status="error" title="Не удалось загрузить данные портала" subTitle="Проверьте доступность backend и попробуйте обновить страницу." />
            </div>
          )}
          {bootState === 'ready' && (
            <BrowserRouter>
              <AppRouter />
            </BrowserRouter>
          )}
        </AppErrorBoundary>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
