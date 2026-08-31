import * as React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { History, Settings, Moon, Sun, LogOut, Globe, Zap } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useFeatureToggle } from '../../hooks/useFeatureToggle';

const components = [
  {
    title: 'Alert Dialog',
    to: '/docs/alert-dialog',
    description: 'A modal dialog that interrupts the user with important content and expects a response.',
  },
  {
    title: 'Hover Card',
    to: '/docs/hover-card',
    description: 'For sighted users to preview content available behind a link.',
  },
  {
    title: 'Progress',
    to: '/docs/progress',
    description:
      'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
  },
  {
    title: 'Scroll-area',
    to: '/docs/scroll-area',
    description: 'Visually or semantically separates content.',
  },
  {
    title: 'Tabs',
    to: '/docs/tabs',
    description: 'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
  },
  {
    title: 'Tooltip',
    to: '/docs/tooltip',
    description:
      'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
  },
];

const AUTOFILL_PRESETS = [
  {
    name: 'Urban 220kV Short Line',
    data: {
      project_type: 'Transmission Line',
      target_cost_inr: 45 * 10000000,
      target_duration_days: 365,
      voltage_level_kv: 220,
      line_length_km: 25,
      number_of_bays: 4,
      terrain_complexity_index: 3,
      environmental_impact_severity: 2,
      forest_land_required_ha: 5,
      annual_rainfall_mm: 1200,
      num_required_permits: 8,
      average_permit_lag_days: 45,
      regulatory_hotspot_region: 'Low',
      labour_cost_estimate_inr: 12 * 10000000,
      material_cost_estimate_inr: 28 * 10000000,
      num_skilled_workers_required: 150,
      vendor_performance_rating: 4,
      material_availability_issue: 'Low',
    }
  },
  {
    name: 'Rural 400kV Long Line',
    data: {
      project_type: 'Transmission Line',
      target_cost_inr: 180 * 10000000,
      target_duration_days: 730,
      voltage_level_kv: 400,
      line_length_km: 120,
      number_of_bays: 8,
      terrain_complexity_index: 7,
      environmental_impact_severity: 5,
      forest_land_required_ha: 45,
      annual_rainfall_mm: 2500,
      num_required_permits: 18,
      average_permit_lag_days: 90,
      regulatory_hotspot_region: 'High',
      labour_cost_estimate_inr: 55 * 10000000,
      material_cost_estimate_inr: 110 * 10000000,
      num_skilled_workers_required: 450,
      vendor_performance_rating: 3,
      material_availability_issue: 'High',
    }
  },
  {
    name: 'Coastal 132kV Medium Line',
    data: {
      project_type: 'Transmission Line',
      target_cost_inr: 65 * 10000000,
      target_duration_days: 450,
      voltage_level_kv: 132,
      line_length_km: 40,
      number_of_bays: 5,
      terrain_complexity_index: 5,
      environmental_impact_severity: 6,
      forest_land_required_ha: 12,
      annual_rainfall_mm: 3200,
      num_required_permits: 12,
      average_permit_lag_days: 60,
      regulatory_hotspot_region: 'Medium',
      labour_cost_estimate_inr: 18 * 10000000,
      material_cost_estimate_inr: 42 * 10000000,
      num_skilled_workers_required: 220,
      vendor_performance_rating: 4,
      material_availability_issue: 'Low',
    }
  },
  {
    name: 'Mountain 765kV Complex',
    data: {
      project_type: 'Transmission Line',
      target_cost_inr: 350 * 10000000,
      target_duration_days: 1095,
      voltage_level_kv: 765,
      line_length_km: 200,
      number_of_bays: 12,
      terrain_complexity_index: 9,
      environmental_impact_severity: 8,
      forest_land_required_ha: 85,
      annual_rainfall_mm: 1800,
      num_required_permits: 25,
      average_permit_lag_days: 120,
      regulatory_hotspot_region: 'High',
      labour_cost_estimate_inr: 95 * 10000000,
      material_cost_estimate_inr: 220 * 10000000,
      num_skilled_workers_required: 750,
      vendor_performance_rating: 2,
      material_availability_issue: 'High',
    }
  },
  {
    name: 'Desert 220kV Standard',
    data: {
      project_type: 'Transmission Line',
      target_cost_inr: 85 * 10000000,
      target_duration_days: 540,
      voltage_level_kv: 220,
      line_length_km: 60,
      number_of_bays: 6,
      terrain_complexity_index: 6,
      environmental_impact_severity: 4,
      forest_land_required_ha: 2,
      annual_rainfall_mm: 400,
      num_required_permits: 10,
      average_permit_lag_days: 50,
      regulatory_hotspot_region: 'Medium',
      labour_cost_estimate_inr: 24 * 10000000,
      material_cost_estimate_inr: 55 * 10000000,
      num_skilled_workers_required: 280,
      vendor_performance_rating: 3,
      material_availability_issue: 'Low',
    }
  },
  {
    name: 'Metro 400kV Urban',
    data: {
      project_type: 'Substation',
      target_cost_inr: 125 * 10000000,
      target_duration_days: 600,
      voltage_level_kv: 400,
      line_length_km: 55,
      number_of_bays: 7,
      terrain_complexity_index: 4,
      environmental_impact_severity: 3,
      forest_land_required_ha: 8,
      annual_rainfall_mm: 1400,
      num_required_permits: 15,
      average_permit_lag_days: 75,
      regulatory_hotspot_region: 'High',
      labour_cost_estimate_inr: 38 * 10000000,
      material_cost_estimate_inr: 78 * 10000000,
      num_skilled_workers_required: 380,
      vendor_performance_rating: 4,
      material_availability_issue: 'Low',
    }
  },
  {
    name: 'Plain 132kV Quick Build',
    data: {
      project_type: 'Distribution',
      target_cost_inr: 35 * 10000000,
      target_duration_days: 270,
      voltage_level_kv: 132,
      line_length_km: 18,
      number_of_bays: 3,
      terrain_complexity_index: 2,
      environmental_impact_severity: 2,
      forest_land_required_ha: 3,
      annual_rainfall_mm: 900,
      num_required_permits: 6,
      average_permit_lag_days: 30,
      regulatory_hotspot_region: 'Low',
      labour_cost_estimate_inr: 9 * 10000000,
      material_cost_estimate_inr: 22 * 10000000,
      num_skilled_workers_required: 120,
      vendor_performance_rating: 5,
      material_availability_issue: 'Low',
    }
  },
  {
    name: 'Flood Zone 220kV',
    data: {
      project_type: 'Transmission Line',
      target_cost_inr: 95 * 10000000,
      target_duration_days: 620,
      voltage_level_kv: 220,
      line_length_km: 70,
      number_of_bays: 7,
      terrain_complexity_index: 6,
      environmental_impact_severity: 7,
      forest_land_required_ha: 22,
      annual_rainfall_mm: 3800,
      num_required_permits: 14,
      average_permit_lag_days: 85,
      regulatory_hotspot_region: 'High',
      labour_cost_estimate_inr: 28 * 10000000,
      material_cost_estimate_inr: 60 * 10000000,
      num_skilled_workers_required: 320,
      vendor_performance_rating: 3,
      material_availability_issue: 'High',
    }
  },
  {
    name: 'Industrial 400kV High-Load',
    data: {
      project_type: 'Substation',
      target_cost_inr: 210 * 10000000,
      target_duration_days: 820,
      voltage_level_kv: 400,
      line_length_km: 145,
      number_of_bays: 10,
      terrain_complexity_index: 5,
      environmental_impact_severity: 5,
      forest_land_required_ha: 38,
      annual_rainfall_mm: 1100,
      num_required_permits: 20,
      average_permit_lag_days: 100,
      regulatory_hotspot_region: 'Medium',
      labour_cost_estimate_inr: 62 * 10000000,
      material_cost_estimate_inr: 135 * 10000000,
      num_skilled_workers_required: 560,
      vendor_performance_rating: 3,
      material_availability_issue: 'Medium',
    }
  },
  {
    name: 'Hill Station 132kV Challenging',
    data: {
      project_type: 'Distribution',
      target_cost_inr: 72 * 10000000,
      target_duration_days: 510,
      voltage_level_kv: 132,
      line_length_km: 48,
      number_of_bays: 5,
      terrain_complexity_index: 8,
      environmental_impact_severity: 6,
      forest_land_required_ha: 28,
      annual_rainfall_mm: 2200,
      num_required_permits: 13,
      average_permit_lag_days: 70,
      regulatory_hotspot_region: 'High',
      labour_cost_estimate_inr: 22 * 10000000,
      material_cost_estimate_inr: 45 * 10000000,
      num_skilled_workers_required: 240,
      vendor_performance_rating: 3,
      material_availability_issue: 'High',
    }
  },
];

function ListItem({
  title,
  children,
  to,
  ...props
}) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link to={to}>
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export default function NavigationMenuDemo({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [showAutofillSubmenu, setShowAutofillSubmenu] = React.useState(false);
  
  // Feature toggles
  const historyEnabled = useFeatureToggle('history');

  React.useEffect(() => {
    try {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const adminEmails = ['abroesly@powergrid.com', 'kesavamoorthi@powergrid.com'];
        setIsAdmin(adminEmails.includes(userData.email));
      }
    } catch (error) {
      console.warn('Unable to check admin status', error);
    }
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng).then(() => {
      localStorage.setItem('language', lng);
      // Force re-render by triggering a custom event
      window.dispatchEvent(new Event('languageChanged'));
    });
  };

  const handleAutofill = (preset) => {
    if (location.pathname !== '/prediction') {
      navigate('/prediction', { state: { autofillPreset: preset } });
    } else {
      window.dispatchEvent(new CustomEvent('autofill-form', { detail: preset }));
    }
  };

  const scrollToSection = (sectionId) => {
    // Scroll to the section on current dashboard page
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isOnDashboard = location.pathname === '/dashboard' || location.pathname.includes('/dashboard');

  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="px-4 py-2 text-sm font-semibold">{t('nav.more')}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[280px] gap-1 p-2">
              {/* Other Options */}
              {historyEnabled && (
                <li>
                  <Link to="/history" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                    <History className="size-4 shrink-0" />
                    <span className="text-sm font-medium">{t('nav.history')}</span>
                  </Link>
                </li>
              )}
              <li>
                <Link to="/settings" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  <Settings className="size-4 shrink-0" />
                  <span className="text-sm font-medium">{t('nav.account')}</span>
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/magic" className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="text-sm shrink-0">✨</span>
                    <span className="text-sm font-medium">{t('nav.magic')}</span>
                  </Link>
                </li>
              )}
              <li>
                <button
                  onClick={toggleTheme}
                  className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  {theme === 'light' ? <Moon className="size-4 shrink-0" /> : <Sun className="size-4 shrink-0" />}
                  <span className="text-sm font-medium">{t('nav.switchTheme')}</span>
                </button>
              </li>
              <li className="border-t border-dashed border-gray-200 mt-1 pt-1">
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="size-4 shrink-0" />
                  <span className="text-sm font-medium">{t('nav.logout')}</span>
                </button>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        {isOnDashboard && (
          <NavigationMenuItem>
            <NavigationMenuTrigger className="px-4 py-2 text-sm font-semibold">Navigate</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[280px] gap-1 p-2">
                <li>
                  <button
                    onClick={() => scrollToSection('gridMap')}
                    className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <span className="text-sm font-medium">India Transmission Network Map</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('substationDetails')}
                    className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <span className="text-sm font-medium">Substation Details</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('voltageDistribution')}
                    className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <span className="text-sm font-medium">Voltage Level Distribution</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('regionalPerformance')}
                    className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <span className="text-sm font-medium">Regional Performance Overview</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('projectTypeSummary')}
                    className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <span className="text-sm font-medium">Project Type Summary</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('powerGridCharts')}
                    className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <span className="text-sm font-medium">Power Grid Analysis Charts</span>
                  </button>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        )}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="px-4 py-2 text-sm font-semibold">{t('nav.language')}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[200px] gap-1 p-2">
              <li>
                <button 
                  onClick={() => changeLanguage('en')}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 hover:bg-black/5 transition-colors text-left ${i18n.language === 'en' ? 'bg-black/10' : ''}`}
                >
                  <span className="text-lg shrink-0">🇬🇧</span>
                  <span className="text-sm font-medium">English</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => changeLanguage('hi')}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 hover:bg-black/5 transition-colors text-left ${i18n.language === 'hi' ? 'bg-black/10' : ''}`}
                >
                  <span className="text-lg shrink-0">🇮🇳</span>
                  <span className="text-sm font-medium">हिंदी</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => changeLanguage('ta')}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 hover:bg-black/5 transition-colors text-left ${i18n.language === 'ta' ? 'bg-black/10' : ''}`}
                >
                  <span className="text-lg shrink-0">🇮🇳</span>
                  <span className="text-sm font-medium">தமிழ்</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => changeLanguage('te')}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 hover:bg-black/5 transition-colors text-left ${i18n.language === 'te' ? 'bg-black/10' : ''}`}
                >
                  <span className="text-lg shrink-0">🇮🇳</span>
                  <span className="text-sm font-medium">తెలుగు</span>
                </button>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
