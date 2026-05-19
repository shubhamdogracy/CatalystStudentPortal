import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
      <div className="text-[120px] font-black text-gray-200 leading-none mb-4 select-none">404</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8 max-w-sm text-[15px]">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="px-6 py-2.5 bg-indigo-600 text-white text-[14px] font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
