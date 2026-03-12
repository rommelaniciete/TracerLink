import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Github, Linkedin, MapPin, Calendar, Facebook } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'About Us',
        href: '/about',
    },
];

const teamMembers = [
    { 
        name: 'Rommel Aniciete', 
        role: 'UI/UX Designer / Frontend Developer',
        skills: ['Frontent Developer','UI Design', 'React', 'Figma'],
        location: 'Pampanga, PH',
        joined: '2023',
        social: {
            github: 'https://github.com/rommelaniciete2',
            linkedin: 'https://www.linkedin.com/in/rommel-aniciete-8194a73b6/',
            email: 'rommelaniciete6@gmail.com',
            facebook: 'https://www.facebook.com/ok.ezme/'
        }
    },
    { 
        name: 'Jhonamar Bernardo', 
        role: 'Backend Developer',
        skills: ['Laravel', 'MySQL', 'API Design'],
        location: 'Pampanga, PH',
        joined: '2023',
        social: {
            github: 'https://github.com/Jhonmar-bernardo2',
            facebook:'https://www.facebook.com/jhonmar.bernardo.2024',
            email: 'jhonamar22@gmail.com'
        }
    },
    { 
        name: 'Riana Marie Manansala', 
        role: 'System Analyst / Technical Writer',
        skills: ['System Analysis', 'Documentation', 'QA'],
        location: 'Bataan, PH',
        joined: '2024',
        social: {
            facebook:'https://www.facebook.com/100005065722794'
        }
    },
    { 
        name: 'Andrew Manalansan', 
        role: 'Design Assistant / Financial Manager',
        skills: ['Finance', 'Graphic Design', 'Planning'],
        location: 'Pampanga, PH',
        joined: '2024',
        social: {
            facebook:'https://www.facebook.com/andrew.manalansan.361133'
        }
    },
    { 
        name: 'John Andrey Orogo', 
        role: 'Printing Officer / Financial Manager',
        skills: ['Print Management', 'Finance', 'Organization'],
        location: 'Pampanga, PH',
        joined: '2024',
        social: {
           facebook:'https://www.facebook.com/johnandrey.orogo.77'
        }
    },
    { 
        name: 'Aj Rafael', 
        role: 'Logistic Support / Financial Manager',
        skills: ['Logistics', 'Inventory', 'Coordination'],
        location: 'Bataan, PH',
        joined: '2024',
        social: {
            facebook:'https://www.facebook.com/aj.rafael.831727'
        }
    },
];

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
};

export default function AboutPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="About Us" />

            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">About Us</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Meet the team behind the Alumni Tracer system.
                    </p>
                </div>

                {/* Team Grid */}
                <Card>
                    <CardHeader>
                        <CardTitle>Development Team</CardTitle>
                        <CardDescription>
                            {teamMembers.length} core members worked on the system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {teamMembers.map((member) => (
                                <div 
                                    key={member.name} 
                                    className="rounded-lg border p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {getInitials(member.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">{member.name}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {member.role}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 space-y-2">
                                        {/* Location & Joined */}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {member.location}
                                            </span>
                                            <span className="flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {member.joined}
                                            </span>
                                        </div>

                                        {/* Skills */}
                                        <div className="flex flex-wrap gap-1">
                                            {member.skills.map((skill) => (
                                                <Badge key={skill} variant="secondary" className="text-xs">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>

                                        {/* Social Links */}
                                        <div className="flex items-center gap-2 pt-1">
                                            {member.social.github && (
                                                <a 
                                                    href={member.social.github} 
                                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Github className="h-4 w-4" />
                                                </a>
                                            )}
                                            {member.social.linkedin && (
                                                <a 
                                                    href={member.social.linkedin}
                                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Linkedin className="h-4 w-4" />
                                                </a>
                                            )}
                                            {member.social.email && (
                                                <a 
                                                    href={`mailto:${member.social.email}`}
                                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                </a>
                                            )}
                                            {member.social.facebook && (
                                                <a 
                                                    href={member.social.facebook}
                                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <Facebook className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid lg:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold">{teamMembers.length}</p>
                            <p className="text-xs text-muted-foreground">Team Members</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold">2025</p>
                            <p className="text-xs text-muted-foreground">Year Started</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold">4C</p>
                            <p className="text-xs text-muted-foreground">Bachelor of Science In Information Technology</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Project Info */}
                <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Our Mission</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                To create a platform that connects alumni with their alma mater, 
                                enabling better tracking of graduate outcomes and fostering 
                                a stronger alumni community.
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Technologies Used</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {['React', 'Laravel', 'MySQL', 'Tailwind', 'Inertia.js', 'TypeScript'].map((tech) => (
                                    <Badge key={tech} variant="outline">
                                        {tech}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
