import type { AuthenticatedRequest } from '../../auth/auth.types';
import type { UserProfileDto } from './dto/user-profile.dto';

export interface UserRequest extends AuthenticatedRequest {
  user?: UserProfileDto;
}
