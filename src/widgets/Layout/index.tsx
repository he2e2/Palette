import cn from 'classnames';
import { Outlet, useLocation } from 'react-router-dom';

//constant
import { NO_PAD_ROUTES } from './constants';
//style
import styles from './Layout.module.scss';
//component
import { ChattingBtn } from './ui/ChattingBtn/ChattingBtn';
import { Footer } from './ui/Footer/Footer';
import { Header } from './ui/Header/Header';

import { useArchiveStore } from '@/features';
import { usePageLifecycle } from '@/shared/hook';

export const Layout = () => {
  const { pathname } = useLocation();
  const isNoPadHeader = NO_PAD_ROUTES.includes(pathname);
  const { resetArchiveData, clearStorage } = useArchiveStore();

  usePageLifecycle({
    onNavigate: () => {
      resetArchiveData();
      clearStorage();
    },
  });

  return (
    <>
      <Header />
      <main className={cn({ [styles.noPadding]: isNoPadHeader })}>
        <Outlet />
        <ChattingBtn />
      </main>
      <Footer />
    </>
  );
};

export default Layout;
