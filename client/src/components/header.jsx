export default function Header({ title }) {
  return (
    <header className="bg-purple-900 bg-opacity-20 backdrop-blur-lg text-white px-6 py-4 shadow-md border-b border-purple-400 border-opacity-30">
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  );
}