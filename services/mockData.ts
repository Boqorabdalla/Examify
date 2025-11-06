
import { User, Institution, UserRole, InstitutionStatus } from '../types';

export const INITIAL_INSTITUTIONS: Institution[] = [
    {
        id: 'inst_mit',
        name: 'Massachusetts Institute of Technology',
        status: InstitutionStatus.ACTIVE,
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/MIT_Seal.svg/200px-MIT_Seal.svg.png',
        type: 'University',
        staffName: 'Dr. Susan Hockfield',
        phone: '617-253-1000',
        location: 'Cambridge, MA'
    }
];

export const INITIAL_USERS: User[] = [
    {
        id: 'user_super',
        username: 'superadmin_new',
        password: 'newpass123',
        role: UserRole.SUPER_ADMIN,
    },
    {
        id: 'user_mit_teacher',
        username: 'teacher_mit',
        password: 'password',
        role: UserRole.TEACHER,
        institutionId: 'inst_mit',
    }
];