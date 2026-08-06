import { CategoriesBanner } from '../CategoriesBanner';
import { BeSocial } from './BeSocial';
import { PreLaunchSection } from './PreLaunchSection';

/**
 * The three bands every inner page ends with: explore the categories, follow
 * us, then the newsletter sign-up. Kept in one component so the running order
 * stays identical across all of them rather than drifting page by page.
 */
export function PageCloser({
  /**
   * Set false on a page that renders <PreLaunchSection /> higher up itself, so
   * the sign-up doesn't appear twice. Only About Event does this today — its
   * pre-launch block sits above The Mission.
   */
  withPreLaunch = true,
}: {
  withPreLaunch?: boolean;
} = {}) {
  return (
    <>
      <CategoriesBanner />
      <BeSocial />
      {withPreLaunch && <PreLaunchSection />}
    </>
  );
}
