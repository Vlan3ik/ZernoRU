import { Button, Card, Space, Typography } from 'antd';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error) {
    console.error('App crashed:', error);
  }

  resetApp = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
          <Card style={{ maxWidth: 620 }}>
            <Space direction="vertical" size={10}>
              <Typography.Title level={3} style={{ margin: 0 }}>
                Не удалось загрузить приложение
              </Typography.Title>
              <Typography.Text type="secondary">
                Обнаружена ошибка инициализации данных. Нажмите кнопку ниже для перезапуска приложения.
              </Typography.Text>
              <Typography.Text code>{this.state.errorMessage || 'Unknown error'}</Typography.Text>
              <Button type="primary" onClick={this.resetApp}>
                Перезапустить
              </Button>
            </Space>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
