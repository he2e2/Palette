import { Suspense } from 'react'; // 코드 스플리팅
import { RouterProvider } from 'react-router-dom';

import AppRouter from './appRouter';
import ModalProvider from './ModalProvider';
import QueryProvider from './QueryProvider';

import { Loader } from '@/shared/ui';

function App() {
  return (
    <QueryProvider>
      <ModalProvider>
        <Suspense fallback={<Loader />}>
          <RouterProvider router={AppRouter()} />
        </Suspense>
      </ModalProvider>
    </QueryProvider>
  );
}

export default App;
