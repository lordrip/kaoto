import { Nav, NavItem, NavList, PageSidebar, PageSidebarBody } from '@patternfly/react-core';
import type { SampleRoute } from '../sampleRoutes';

interface RouteSidebarProps {
  routes: SampleRoute[];
  selectedRoute: SampleRoute | undefined;
  onSelectRoute: (route: SampleRoute) => void;
}

export function RouteSidebar({ routes, selectedRoute, onSelectRoute }: RouteSidebarProps) {
  return (
    <PageSidebar>
      <PageSidebarBody>
        <Nav aria-label="Route list">
          <NavList>
            {routes.map((route) => (
              <NavItem
                key={route.filename}
                isActive={selectedRoute?.filename === route.filename}
                onClick={() => onSelectRoute(route)}
              >
                {route.name}
              </NavItem>
            ))}
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
}
