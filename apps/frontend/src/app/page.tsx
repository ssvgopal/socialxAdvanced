export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to SocialX Advanced
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A modern, scalable social platform with AI-powered features
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                🚀 Modern Stack
              </h2>
              <p className="text-gray-600">
                Built with Next.js 14, TypeScript, and cutting-edge technologies
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                🤖 AI-Powered
              </h2>
              <p className="text-gray-600">
                Intelligent features powered by advanced machine learning
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                ☁️ Cloud Native
              </h2>
              <p className="text-gray-600">
                Scalable architecture designed for modern cloud infrastructure
              </p>
            </div>
          </div>
          
          <div className="mt-12">
            <p className="text-gray-500">
              Infrastructure is running • Check the README for development setup
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}