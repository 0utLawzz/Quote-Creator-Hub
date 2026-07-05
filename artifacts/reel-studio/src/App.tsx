import { Route, Switch, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Shell } from '@/components/layout/Shell';

import Dashboard from '@/pages/Dashboard';
import CreateReel from '@/pages/CreateReel';
import Library from '@/pages/Library';
import Schedule from '@/pages/Schedule';
import Templates from '@/pages/Templates';
import Connect from '@/pages/Connect';
import Strategy from '@/pages/Strategy';

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/"          component={Dashboard} />
        <Route path="/create"    component={CreateReel} />
        <Route path="/library"   component={Library} />
        <Route path="/schedule"  component={Schedule} />
        <Route path="/templates" component={Templates} />
        <Route path="/connect"   component={Connect} />
        <Route path="/strategy"  component={Strategy} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
